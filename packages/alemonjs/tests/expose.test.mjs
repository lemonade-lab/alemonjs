import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import {
  defineChildren,
  getCurrentAppName,
  getCurrentEvent,
  loadChildren,
  registerExpose,
  Expose,
  getExposeContext,
  ExposeError,
  shutdownLogger
} from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';

after(() => shutdownLogger());
const text = { type: 'string' };
const number = { type: 'integer', minimum: 1, maximum: 10 };
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
async function fixture(t, actions, name = 'provider') {
  const app = createTestApp();
  t.after(() => app.dispose());
  const client = Expose.create();
  const config = { name: 'game', description: 'game actions', version: '1', actions };
  await app.mount({ expose: Expose.create().provide(config) }, undefined, name);
  return { app, client, config, call: (action, input, options) => app.run(() => client.call('game', name, action, input, options)) };
}
const action = (handler, extra = {}) => ({ description: 'read state', inputSchema: text, outputSchema: text, effect: 'read', handler, ...extra });

test('legacy invocation remains synchronous or asynchronous, with per-provider discovery', async t => {
  const { app, client } = await fixture(t, { read: { description: 'read', handler: value => value }, async: { description: 'async', handler: async () => 2 } });
  assert.equal(
    app.run(() => client.invoke('game', 'provider', 'read', 1)),
    1
  );
  assert.equal(await app.run(() => client.invoke('game', 'provider', 'async')), 2);
  await app.mount(
    { expose: Expose.create().provide({ name: 'game', description: 'other', actions: { other: { description: 'other action', handler: () => 3 } } }) },
    undefined,
    'other'
  );
  const schema = app.run(() => client.schema());
  assert.equal(schema.length, 2);
  assert.deepEqual(Object.keys(schema[0].actions), ['read', 'async']);
  assert.deepEqual(Object.keys(schema[1].actions), ['other']);
  assert.deepEqual(schema[1].providers, [{ name: 'other' }]);
  assert.equal((await app.run(() => client.call('game', 'provider', 'read', 1))).error.code, 'CONTRACT_REQUIRED');
});

test('validated calls reject invalid input before side effects and report output violations as unknown', async t => {
  let writes = 0;
  const { call } = await fixture(t, {
    write: action(
      input => {
        writes++;
        return input;
      },
      { inputSchema: number, outputSchema: number, effect: 'write' }
    ),
    broken: action(() => 42)
  });
  for (const input of [0, 11, 1.2, NaN, Infinity, '1']) {
    const result = await call('write', input);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'INVALID_INPUT');
    assert.equal(result.error.outcome, 'not_started');
  }
  assert.equal(writes, 0);
  const result = await call('write', 2);
  assert.equal(result.ok, true);
  assert.equal(result.data, 2);
  assert.ok(result.callId);
  assert.equal(writes, 1);
  const broken = await call('broken', 'ok');
  assert.equal(broken.error.code, 'INVALID_OUTPUT');
  assert.equal(broken.error.outcome, 'unknown');
});

test('objects, arrays, enum and unicode lengths are checked without coercion', async t => {
  const inputSchema = {
    type: 'object',
    properties: {
      mode: { type: 'string', enum: ['练气'] },
      names: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 1 }, minItems: 1, maxItems: 2 }
    },
    required: ['mode', 'names'],
    additionalProperties: false
  };
  const { call } = await fixture(t, { read: action(() => 'ok', { inputSchema }) });
  assert.equal((await call('read', { mode: '练气', names: ['😀'] })).ok, true);
  for (const input of [{ mode: 'bad', names: ['a'] }, { mode: '练气', names: ['ab'] }, { mode: '练气' }, { mode: '练气', names: [], extra: 1 }]) {
    assert.equal((await call('read', input)).error.code, 'INVALID_INPUT');
  }
});

test('registration rejects unsupported constraints atomically', async t => {
  const { app, client } = await fixture(t, { read: action(value => value) });
  await assert.rejects(
    app.mount(
      {
        expose: Expose.create().provide({
          name: 'bad',
          description: 'bad',
          actions: { read: action(value => value, { inputSchema: { type: 'string', pattern: '^x$' } }) }
        })
      },
      undefined,
      'bad'
    ),
    /Unsupported Expose schema keyword/
  );
  assert.equal(
    app.run(() => client.list('bad').length),
    0
  );
  assert.equal(
    app.run(() => client.list('game').length),
    1
  );
});

test('metadata is isolated from provider and consumer mutation', async t => {
  const configAction = action(value => value, { inputSchema: { type: 'string', enum: ['a'] } });
  const { app, client, call } = await fixture(t, { read: configAction });
  configAction.inputSchema.enum.push('b');
  app.run(() => client.schema()[0].actions.read.inputSchema.enum.push('b'));
  assert.equal((await call('read', 'b')).error.code, 'INVALID_INPUT');
});

test('both invocation paths enforce authorization and reject inherited action names', async t => {
  let calls = 0;
  const { app, client, call } = await fixture(t, {
    write: action(
      () => {
        calls++;
        return 'ok';
      },
      { authorize: async () => false }
    )
  });
  assert.equal((await call('write', 'x')).error.code, 'FORBIDDEN');
  await assert.rejects(
    app.run(() => client.invoke('game', 'provider', 'write', 'x')),
    error => error.code === 'FORBIDDEN'
  );
  await assert.rejects(
    app.run(() => client.list()[0].invoke('write', 'x')),
    error => error.code === 'FORBIDDEN'
  );
  for (const name of ['toString', 'constructor', '__proto__']) assert.equal((await call(name, 'x')).error.code, 'ACTION_NOT_FOUND');
  assert.equal(calls, 0);
});

test('cached handles cannot invoke unloaded or replacement providers', async t => {
  const { app, client } = await fixture(t, { read: action(value => value) });
  const handle = app.run(() => client.list()[0]);
  await app.unmount('provider');
  assert.throws(
    () => app.run(() => handle.invoke('read', 'x')),
    error => error.code === 'STALE_PROVIDER'
  );
  await app.mount({ expose: Expose.create().provide({ name: 'game', description: 'new', actions: { read: action(() => 'new') } }) }, undefined, 'provider');
  assert.throws(
    () => app.run(() => handle.invoke('read', 'x')),
    error => error.code === 'STALE_PROVIDER'
  );
  assert.equal(
    app.run(() => client.list()[0].invoke('read', 'x')),
    'new'
  );
});

test('watch waits for successful completion, honors effects and isolates rejected observers', async t => {
  const pending = deferred();
  const { app, client } = await fixture(t, {
    save: action(() => pending.promise, { effect: 'write' }),
    query: action(value => value),
    broken: action(
      async () => {
        throw new Error('private');
      },
      { effect: 'write' }
    )
  });
  const events = [];
  app.run(() => {
    client.watch(event => events.push(event));
    client.watch(async () => {
      throw new Error('observer failed');
    });
  });
  const result = app.run(() => client.invoke('game', 'provider', 'save', 'x'));
  assert.equal(events.length, 0);
  pending.resolve('done');
  assert.equal(await result, 'done');
  assert.equal(events.length, 1);
  app.run(() => client.invoke('game', 'provider', 'query', 'x'));
  await assert.rejects(
    app.run(() => client.invoke('game', 'provider', 'broken', 'x')),
    /private/
  );
  assert.equal(events.length, 1);
});

test('pre-cancellation and invalid deadlines never execute; handler failures are sanitized', async t => {
  let calls = 0;
  const { call } = await fixture(t, {
    read: action(() => {
      calls++;
      throw new Error('SECRET');
    })
  });
  const controller = new AbortController();
  controller.abort();
  const cancelled = await call('read', 'x', { signal: controller.signal });
  assert.equal(cancelled.error.code, 'ABORTED');
  assert.equal(cancelled.error.outcome, 'not_started');
  assert.equal((await call('read', 'x', { timeoutMs: 0 })).error.code, 'INVALID_OPTIONS');
  assert.equal(calls, 0);
  const failed = await call('read', 'x');
  assert.equal(failed.error.code, 'HANDLER_FAILED');
  assert.equal(JSON.stringify(failed).includes('SECRET'), false);
  assert.equal(failed.error.outcome, 'unknown');
});

test('timeout reports uncertain outcome, signals the handler, and never emits late success', async t => {
  const pending = deferred();
  let signal;
  const { app, client, call } = await fixture(t, {
    write: action(
      (_, context) => {
        signal = context.signal;
        return pending.promise;
      },
      { effect: 'write' }
    )
  });
  const events = [];
  app.run(() => client.watch(event => events.push(event)));
  const result = await call('write', 'x', { timeoutMs: 10 });
  assert.equal(result.error.code, 'TIMEOUT');
  assert.equal(result.error.outcome, 'unknown');
  assert.equal(signal.aborted, true);
  pending.resolve('done');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(events.length, 0);
});

test('unload during authorization prevents execution; unload during execution yields unknown', async t => {
  const permission = deferred();
  let writes = 0;
  const { app, call } = await fixture(t, {
    write: action(
      () => {
        writes++;
        return 'ok';
      },
      { authorize: () => permission.promise }
    )
  });
  const result = call('write', 'x');
  await new Promise(resolve => setImmediate(resolve));
  await app.unmount('provider');
  const outcome = await result;
  assert.equal(outcome.error.code, 'STALE_PROVIDER');
  assert.equal(outcome.error.outcome, 'not_started');
  permission.resolve(true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes, 0);
});

test('nested calls preserve provider caller and parent id without forging chat identity', async t => {
  let outer;
  const { app, client } = await fixture(t, {
    read: action((_, ctx) => {
      assert.equal(getExposeContext(), ctx);
      assert.equal(ctx.callerApp, 'provider-b');
      assert.equal(ctx.parentCallId, outer.callId);
      return 'ok';
    })
  });
  await app.mount(
    {
      expose: Expose.create().provide({
        name: 'outer',
        description: 'outer',
        actions: {
          read: action(async (_, ctx) => {
            outer = ctx;
            const result = await client.call('game', 'provider', 'read', 'x');
            assert.equal(result.ok, true);
            return result.data;
          })
        }
      })
    },
    undefined,
    'provider-b'
  );
  const event = app.events.privateMessage({ text: '/ai' });
  const run = await app.invoke(event, () => client.call('outer', 'provider-b', 'read', 'x'), 'ai-plugin');
  assert.equal(run.value.ok, true);
  assert.equal(outer.callerApp, 'ai-plugin');
  assert.equal(outer.parentCallId, undefined);
  assert.equal(getExposeContext(), undefined);
});

test('watchers owned by an event-context plugin are removed on unmount', async t => {
  const { app, client } = await fixture(t, { write: action(value => value, { effect: 'write' }) });
  await app.mount({}, undefined, 'observer');
  let notifications = 0;
  await app.invoke(
    app.events.privateMessage(),
    () =>
      client.watch(() => {
        notifications++;
      }),
    'observer'
  );
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  assert.equal(notifications, 1);
  await app.unmount('observer');
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  assert.equal(notifications, 1);
});

test('runtime scopes do not share providers', async t => {
  const { app, client } = await fixture(t, { read: action(value => value) });
  const other = createTestApp();
  t.after(() => other.dispose());
  assert.equal(
    other.run(() => client.list().length),
    0
  );
  assert.equal(
    app.run(() => client.list().length),
    1
  );
});

test('unloading an executing provider aborts its call with unknown business outcome', async t => {
  const pending = deferred();
  let signal;
  const { app, call } = await fixture(t, {
    write: action((_, context) => {
      signal = context.signal;
      return pending.promise;
    })
  });
  const running = call('write', 'x');
  await new Promise(resolve => setImmediate(resolve));
  await app.unmount('provider');
  const result = await running;
  assert.equal(result.error.code, 'STALE_PROVIDER');
  assert.equal(result.error.outcome, 'unknown');
  assert.equal(signal.aborted, true);
  pending.reject(new Error('late private failure'));
  await new Promise(resolve => setImmediate(resolve));
});

test('external cancellation during authorization prevents subsequent writes', async t => {
  const permission = deferred();
  const controller = new AbortController();
  let writes = 0;
  const { call } = await fixture(t, {
    write: action(
      () => {
        writes++;
        return 'ok';
      },
      { authorize: () => permission.promise }
    )
  });
  const running = call('write', 'x', { signal: controller.signal });
  await new Promise(resolve => setImmediate(resolve));
  controller.abort();
  const result = await running;
  assert.equal(result.error.code, 'ABORTED');
  assert.equal(result.error.outcome, 'not_started');
  permission.resolve(true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes, 0);
});

test('input snapshot remains stable while asynchronous authorization waits', async t => {
  const permission = deferred();
  const object = { type: 'object', properties: { amount: number }, required: ['amount'], additionalProperties: false };
  const { call } = await fixture(t, { write: action(input => String(input.amount), { inputSchema: object, authorize: () => permission.promise }) });
  const input = { amount: 1 };
  const running = call('write', input);
  input.amount = 9;
  permission.resolve(true);
  assert.equal((await running).data, '1');
});

test('watch callbacks never inherit the notifying provider authority', async t => {
  const callers = [];
  const { app, client } = await fixture(t, {
    write: action(value => value, { effect: 'write' }),
    read: action((_, context) => {
      callers.push(context.callerApp);
      return 'ok';
    })
  });
  await app.mount({}, undefined, 'observer');
  await app.invoke(app.events.privateMessage(), () => client.watch('game', () => client.invoke('game', 'provider', 'read', 'x')), 'observer');
  await app.invoke(app.events.privateMessage(), () => client.invoke('game', 'provider', 'write', 'x'), 'ai-plugin');
  assert.deepEqual(callers, ['observer']);
});

test('accessors are rejected without execution on both input and output', async t => {
  let reads = 0;
  let writes = 0;
  const object = { type: 'object', properties: { count: { type: 'integer', maximum: 1 } }, required: ['count'], additionalProperties: false };
  const accessor = () => ({
    get count() {
      reads++;
      return reads === 1 ? 1 : 99;
    }
  });
  const { call } = await fixture(t, {
    input: action(
      () => {
        writes++;
        return 'ok';
      },
      { inputSchema: object }
    ),
    output: action(() => accessor(), { outputSchema: object })
  });
  const input = await call('input', accessor());
  assert.equal(input.error.code, 'INVALID_INPUT');
  assert.equal(input.error.outcome, 'not_started');
  assert.equal(writes, 0);
  const output = await call('output', 'x');
  assert.equal(output.error.code, 'INVALID_OUTPUT');
  assert.equal(output.error.outcome, 'unknown');
  assert.equal(reads, 0);
});

test('snapshots reject lossy data and retain nested array values', async t => {
  const schema = { type: 'object', properties: { values: { type: 'array', items: text } }, required: ['values'], additionalProperties: false };
  const { call } = await fixture(t, { read: action(input => input, { inputSchema: schema, outputSchema: schema }) });
  assert.deepEqual((await call('read', { values: ['a', 'b'] })).data, { values: ['a', 'b'] });
  const cyclic = {};
  cyclic.values = cyclic;
  const hidden = { values: ['a'] };
  Object.defineProperty(hidden, 'secret', { value: 1 });
  for (const input of [cyclic, hidden, { values: new Array(1) }, { values: ['a'], [Symbol('extra')]: 1 }, new Date()]) {
    assert.equal((await call('read', input)).error.code, 'INVALID_INPUT');
  }
});

test('abort callbacks cannot reenter a retiring provider through direct or cached handles', async t => {
  const attempts = [];
  let handle;
  let writes = 0;
  const { app, client, call } = await fixture(t, {
    write: action(() => {
      writes++;
      return 'ok';
    }),
    pending: action((_, context) => {
      context.signal.addEventListener('abort', () => {
        for (const invoke of [() => client.invoke('game', 'provider', 'write', 'x'), () => handle.invoke('write', 'x')]) {
          try {
            invoke();
            attempts.push('executed');
          } catch (error) {
            attempts.push(error.code);
          }
        }
      });
      return new Promise(() => {});
    })
  });
  handle = app.run(() => client.list()[0]);
  const running = call('pending', 'x');
  await app.unmount('provider');
  assert.equal((await running).error.code, 'STALE_PROVIDER');
  assert.deepEqual(attempts, ['STALE_PROVIDER', 'STALE_PROVIDER']);
  assert.equal(writes, 0);
});

test('creation, registration, mounted, ready and dispose bind plugin identity without chat events', async t => {
  const observations = [];
  let notifications = 0;
  const { app, client } = await fixture(t, {
    read: action((_, context) => {
      observations.push(context.callerApp);
      return 'ok';
    }),
    write: action(value => value, { effect: 'write' })
  });
  const check = async () => {
    assert.equal(getCurrentAppName(), 'observer');
    assert.equal(getCurrentEvent(), undefined);
    assert.equal((await client.call('game', 'provider', 'read', 'x')).ok, true);
  };
  await app.mount(
    defineChildren({
      async onCreated() {
        await check();
        client.watch(() => {
          notifications++;
        });
      },
      async register() {
        await check();
        return {};
      },
      onMounted: check,
      onReady: check,
      onDispose: check
    }),
    undefined,
    'observer'
  );
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  assert.equal(notifications, 1);
  await app.unmount('observer');
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  assert.equal(notifications, 1);
  assert.deepEqual(observations, Array(5).fill('observer'));
  assert.equal(getCurrentAppName(), undefined);
});

test('production loader binds lifecycle ownership and releases startup observers', async t => {
  const { app, client } = await fixture(t, { write: action(value => value, { effect: 'write' }) });
  const directory = await mkdtemp(join(tmpdir(), 'expose-lifecycle-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = join(directory, 'plugin.mjs');
  const entry = new URL('../lib/index.js', import.meta.url).href;
  await writeFile(
    file,
    `import { Expose, defineChildren, getCurrentAppName } from ${JSON.stringify(entry)};
    const seen = []; const x = Expose.create();
    export default defineChildren({
      onCreated() { seen.push(getCurrentAppName()); x.watch('game', () => seen.push('notification')); },
      register() { seen.push(getCurrentAppName()); return { expose: x.provide({ name: 'loaded', description: 'loaded', actions: {
        read: { description: 'read', handler: () => seen }
      } }) }; },
      onMounted() { seen.push(getCurrentAppName()); },
      onReady() { seen.push(getCurrentAppName()); }
    });`
  );
  await app.run(() => loadChildren(file, 'loaded-plugin'));
  const seen = app.run(() => client.invoke('loaded', 'loaded-plugin', 'read'));
  assert.deepEqual(seen, Array(4).fill('loaded-plugin'));
  // 通过清理后的 watcher 行为验证归属；避免依赖已卸载 provider 的句柄。
  let downstream = 0;
  app.run(() =>
    client.watch('game', () => {
      downstream++;
    })
  );
  await app.unmount('loaded-plugin');
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  assert.equal(downstream, 1);
  assert.deepEqual(seen, Array(4).fill('loaded-plugin'));
  assert.equal(
    app.run(() => client.list('loaded').length),
    0
  );
});

test('replacement invalidates old entries before notifying cancellation', async t => {
  let attempt;
  const { app, client, call } = await fixture(t, {
    read: action(() => 'old'),
    pending: action((_, context) => {
      context.signal.addEventListener('abort', () => {
        try {
          attempt = client.invoke('game', 'provider', 'read', 'x');
        } catch (error) {
          attempt = error.code;
        }
      });
      return new Promise(() => {});
    })
  });
  const running = call('pending', 'x');
  app.run(() => registerExpose('provider', [{ name: 'game', description: 'replacement', actions: { read: action(() => 'new') } }]));
  assert.equal((await running).error.code, 'STALE_PROVIDER');
  assert.equal(attempt, 'STALE_PROVIDER');
  assert.equal(
    app.run(() => client.invoke('game', 'provider', 'read', 'x')),
    'new'
  );
});

test('unloading an app invalidates all its protocols before any abort callback', async t => {
  let attempt;
  const { app, client, call } = await fixture(t, {
    pending: action((_, context) => {
      context.signal.addEventListener('abort', () => {
        try {
          attempt = client.invoke('second', 'provider', 'read', 'x');
        } catch (error) {
          attempt = error.code;
        }
      });
      return new Promise(() => {});
    })
  });
  app.run(() => registerExpose('provider', [{ name: 'second', description: 'second', actions: { read: action(() => 'old') } }]));
  const running = call('pending', 'x');
  await app.unmount('provider');
  assert.equal((await running).error.code, 'STALE_PROVIDER');
  assert.equal(attempt, 'STALE_PROVIDER');
});

test('nested plugin lifecycle replaces parent Expose identity and owns its watchers', async t => {
  let observed;
  let notifications = 0;
  const { app, client, call } = await fixture(t, {
    restricted: action(value => value, { authorize: (_, context) => context.callerApp === 'provider' }),
    write: action(value => value, { effect: 'write' }),
    launch: action(async () => {
      assert.equal((await client.call('game', 'provider', 'restricted', 'x')).ok, true);
      await app.mount(
        {},
        {
          async onCreated() {
            assert.equal(getCurrentAppName(), 'child');
            assert.equal(getExposeContext(), undefined);
            client.watch('game', () => {
              notifications++;
            });
            observed = await client.call('game', 'provider', 'restricted', 'x');
          }
        },
        'child'
      );
      assert.equal(getExposeContext().provider, 'provider');
      assert.equal((await client.call('game', 'provider', 'restricted', 'x')).ok, true);
      return 'ok';
    })
  });
  assert.equal((await call('launch', 'x')).ok, true);
  assert.equal(observed.error.code, 'FORBIDDEN');
  await app.unmount('child');
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  assert.equal(notifications, 0);
});

test('lifecycle entered by a watch callback does not inherit observer authority', async t => {
  const done = deferred();
  let seen;
  const { app, client } = await fixture(t, {
    read: action((_, context) => {
      seen = context.callerApp;
      return 'ok';
    }),
    write: action(value => value, { effect: 'write' })
  });
  await app.mount({}, undefined, 'observer');
  await app.invoke(
    app.events.privateMessage(),
    () =>
      client.watch('game', async () => {
        try {
          await app.mount(
            {},
            {
              onCreated() {
                client.invoke('game', 'provider', 'read', 'x');
              }
            },
            'watch-child'
          );
          done.resolve();
        } catch (error) {
          done.reject(error);
        }
      }),
    'observer'
  );
  app.run(() => client.invoke('game', 'provider', 'write', 'x'));
  await done.promise;
  assert.equal(seen, 'watch-child');
});

test('authorization receives a separate deeply frozen snapshot', async t => {
  const object = {
    type: 'object',
    properties: { nested: { type: 'object', properties: { count: { type: 'integer', maximum: 1 } }, required: ['count'], additionalProperties: false } },
    required: ['nested'],
    additionalProperties: false
  };
  let authorized;
  let writes = 0;
  const { call } = await fixture(t, {
    safe: action(
      value => {
        assert.notEqual(value, authorized);
        assert.equal(value.nested.count, 1);
        writes++;
        return 'ok';
      },
      {
        inputSchema: object,
        authorize: value => {
          authorized = value;
          assert.equal(Object.isFrozen(value), true);
          assert.equal(Object.isFrozen(value.nested), true);
          assert.throws(() => {
            value.nested.count = 99;
          }, TypeError);
          return true;
        }
      }
    ),
    broken: action(
      () => {
        writes++;
        return 'ok';
      },
      {
        inputSchema: object,
        authorize: value => {
          value.nested.count = 99;
          return true;
        }
      }
    )
  });
  assert.equal((await call('safe', { nested: { count: 1 } })).ok, true);
  const failed = await call('broken', { nested: { count: 1 } });
  assert.equal(failed.error.code, 'HANDLER_FAILED');
  assert.equal(failed.error.outcome, 'not_started');
  assert.equal(writes, 1);
});

test('invalid options return structured errors and never evaluate accessors', async t => {
  let calls = 0;
  let reads = 0;
  const { call } = await fixture(t, {
    read: action(() => {
      calls++;
      return 'ok';
    })
  });
  for (const options of [
    null,
    false,
    [],
    1,
    { signal: {} },
    { signal: null },
    { timeoutMs: '10' },
    { callerApp: 'admin' },
    {
      get signal() {
        reads++;
        return new AbortController().signal;
      }
    }
  ]) {
    const result = await call('read', 'x', options);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'INVALID_OPTIONS');
    assert.equal(result.error.outcome, 'not_started');
  }
  assert.equal(calls, 0);
  assert.equal(reads, 0);
});

test('cleanup uses the captured native signal even if caller options or signal methods change', async t => {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let internalSignal;
  controller.signal.removeEventListener = () => {
    throw new Error('overridden remove');
  };
  const { call } = await fixture(t, {
    read: action((_, context) => {
      internalSignal = context.signal;
      options.signal = {};
      return 'ok';
    })
  });
  assert.equal((await call('read', 'x', options)).ok, true);
  controller.abort();
  assert.equal(internalSignal.aborted, false);
});
