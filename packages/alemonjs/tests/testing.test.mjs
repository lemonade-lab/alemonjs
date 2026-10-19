import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { spawn } from 'node:child_process';
import { createTestApp, createTestEvents } from 'alemonjs/testing';
import {
  Format,
  useMessage,
  useEvent,
  useMention,
  onResponse,
  defineResponse,
  Router,
  createContext,
  configureContext,
  getConfig,
  ResultCode,
  createResult,
  scheduleTimeout,
  scheduleInterval,
  scheduleList,
  shutdownLogger,
  ChildrenApp
} from 'alemonjs';
after(() => shutdownLogger());

const ok = data => [createResult(ResultCode.Ok, 'OK', data)];
const withApp = (t, options) => {
  const app = createTestApp(options);
  t.after(() => app.dispose());
  return app;
};

test('published entry imports and exits without a processor maintenance timer', async () => {
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import {createTestApp} from 'alemonjs/testing'; await createTestApp().dispose(); const {shutdownLogger}=await import('alemonjs'); await shutdownLogger();"
    ],
    { stdio: 'pipe' }
  );
  let output = '';
  child.stderr.on('data', data => (output += data));
  const timer = setTimeout(() => child.kill(), 3000);
  const [code, signal] = await new Promise(resolve => child.on('exit', (...args) => resolve(args)));
  clearTimeout(timer);
  assert.equal(signal, null, output);
  assert.equal(code, 0, output);
});

test('events have stable opaque IDs, targets and private/interaction kinds', () => {
  const events = createTestEvents(() => 123);
  const a = events.groupMessage({ userId: '001', groupId: 'g' });
  const b = events.privateMessage({ userId: '002' });
  assert.notEqual(a.MessageId, b.MessageId);
  assert.equal(a.Timestamp, 123);
  assert.deepEqual(a.Target, { scope: 'group', targetId: 'g', BotId: 'test-bot' });
  assert.equal(b.IsPrivate, true);
  assert.equal(b.Target.targetId, '002');
  assert.equal(events.interaction({ private: true }).name, 'private.interaction.create');
});

test('real mention/message hooks produce nested Format and correct group destination', async t => {
  const app = withApp(t);
  app.actions.on('mention.get', () => ok([{ UserId: '001', UserName: '宋玉' }]));
  const handler = onResponse(['message.create'], async () => {
    const [mention] = useMention();
    const user = await mention.findOne();
    const md = Format.createMarkdown().addText(`hello, ${user.data.UserName}!`).addButton('继续', { data: '/继续' });
    const format = Format.create().addMarkdown(Format.createMarkdown().addBlockquote(md));
    void useMessage()[0].send({ format });
  });
  const result = await app.runHandler(handler, app.events.groupMessage({ groupId: 'room' }));
  assert.equal(result.messages.length, 1);
  assert.match(result.messages[0].text, /hello, 宋玉!/);
  assert.deepEqual(result.messages[0].commands, ['/继续']);
  assert.equal(result.messages[0].target.targetId, 'room');
  assert.equal(result.actions[0].name, 'mention.get');
  assert.equal(result.actions[1].results[0].code, ResultCode.Ok);
  assert.ok(result.messages[0].nodes[0].value[0].value.some(node => node.type === 'MD.button'));
});

test('awaits ignored send promises, preserves failed receipts and allows business failure handling', async t => {
  const app = withApp(t);
  let finish;
  let entered;
  const ready = new Promise(resolve => (entered = resolve));
  app.actions.on('message.send', () => {
    entered();
    return new Promise(resolve => (finish = resolve));
  });
  let settled = false;
  const pending = app
    .runHandler(() => {
      void useMessage()[0].send(Format.create().addText('A').value);
    }, app.events.privateMessage())
    .then(result => {
      settled = true;
      return result;
    });
  await ready;
  assert.equal(settled, false);
  finish([createResult(ResultCode.Fail, 'denied', null)]);
  const result = await pending;
  assert.equal(result.actions[0].results[0].message, 'denied');
  app.actions.on('message.send', () => {
    throw new Error('offline');
  });
  const handled = await app.runHandler(async () => {
    try {
      await useMessage()[0].send(Format.create().addText('B').value);
    } catch (error) {
      return error.message;
    }
  }, app.events.privateMessage());
  assert.equal(handled.value, 'offline');
});

test('unconfigured actions fail even if a public hook converts the exception to a result', async t => {
  const app = withApp(t);
  await assert.rejects(
    app.runHandler(async () => useMention()[0].findOne(), app.events.groupMessage()),
    /Unmocked action: mention.get/
  );
});

test('onResponse event filters and handler-chain continuation semantics use the real context', async t => {
  const app = withApp(t);
  let calls = 0;
  await app.runHandler(
    onResponse('private.message.create', () => calls++),
    app.events.groupMessage()
  );
  assert.equal(calls, 0);
  const result = await app.runHandler(
    onResponse('message.create', [
      () => {
        calls++;
        return true;
      },
      () => {
        useEvent()[1](true);
        return true;
      },
      () => {
        throw new Error('must stop after next');
      }
    ]),
    app.events.groupMessage()
  );
  assert.equal(calls, 1);
  assert.deepEqual(result.nextCalls, [[true]]);
});

test('dispatch uses real middleware, lazy Router and event filtering', async t => {
  const app = withApp(t);
  const steps = [];
  const middleware = Router.create({ events: ['message.create'] });
  middleware.use('签到', () => () => {
    steps.push('middleware');
    useEvent()[1]();
  });
  const router = Router.create({ events: ['message.create'] });
  router.use('签到', () => async () => {
    steps.push('handler');
    await useMessage()[0].send({ format: Format.create().addText('签到成功') });
  });
  await app.mount({ middlewareRouter: middleware.define, responseRouter: router.define });
  const result = await app.dispatch(app.events.groupMessage({ text: '签到' }));
  assert.deepEqual(steps, ['middleware', 'handler']);
  assert.equal(result.messages[0].text, '签到成功');
  app.configure({ disabled_user_id: ['blocked'] });
  const denied = await app.dispatch(app.events.groupMessage({ text: '签到', userId: 'blocked' }));
  assert.equal(denied.messages.length, 0);
  assert.ok(denied.reasons.includes('filtered'));
});

test('separate concurrent apps isolate config, routes, targets, Context and per-event records', async t => {
  const apps = [withApp(t, { config: { marker: 'A' } }), withApp(t, { config: { marker: 'B' } })];
  const context = createContext({
    name: 'shared-definition',
    events: ['message.create'],
    scope: ['UserId'],
    initialState: { count: 0 },
    handlers: {
      step: async (_event, state) => {
        state.count++;
        await useMessage()[0].send({ format: Format.create().addText(`${getConfig().value.marker}:${state.count}`) });
      }
    }
  });
  for (const app of apps) {
    await app.mount({ responseContent: configureContext({ contexts: { context } }) });
    await app.invoke(app.events.groupMessage(), () => context.step());
  }
  const results = await Promise.all(apps.map((app, i) => app.dispatch(app.events.groupMessage({ groupId: String(i) }))));
  assert.deepEqual(
    results.map(result => result.messages[0].text),
    ['A:1', 'B:1']
  );
  assert.ok(results.every(result => result.context.claimed));
  assert.deepEqual(
    results.map(result => result.actions.length),
    [1, 1]
  );
  assert.deepEqual(
    results.map(result => result.messages[0].target.targetId),
    ['0', '1']
  );
});

test('same-app concurrent events keep action logs and async hook contexts separate', async t => {
  const app = withApp(t);
  const handler = async () => {
    const [{ current }] = useEvent();
    await new Promise(resolve => setTimeout(resolve, current.UserId === 'a' ? 5 : 1));
    await useMessage()[0].send({ format: Format.create().addText(current.UserId) });
  };
  const result = await Promise.all(['a', 'b'].map(userId => app.runHandler(handler, app.events.privateMessage({ userId }))));
  assert.deepEqual(
    result.map(run => run.messages[0].text),
    ['a', 'b']
  );
  assert.deepEqual(
    result.map(run => run.messages[0].target.targetId),
    ['a', 'b']
  );
  assert.deepEqual(
    result.map(run => run.actions.length),
    [1, 1]
  );
});

test('virtual time expires real Context, executes schedules and disposal only clears owned state', async t => {
  const app = withApp(t);
  const context = createContext({ name: 'expires', events: ['message.create'], scope: ['UserId'], expiresIn: '1s', initialState: {}, handlers: { step() {} } });
  await app.mount({ responseContent: configureContext({ contexts: { context } }) });
  await app.invoke(app.events.groupMessage(), () => {
    context.step();
    scheduleTimeout(() => {
      void useMessage()[0].send({ format: Format.create().addText('timer') });
    }, 500);
    scheduleInterval(() => {}, 100);
  });
  assert.equal(app.clock.pending, 3);
  const tick = await app.clock.advance(1000);
  assert.equal(tick.messages[0].text, 'timer');
  const result = await app.dispatch(app.events.groupMessage());
  assert.equal(result.context.claimed, false);
  await app.dispose();
  assert.equal(app.clock.pending, 0);
  await assert.rejects(async () => app.dispatch(app.events.groupMessage()), /disposed/);
  assert.equal(scheduleList().length, 0);
});

test('duplicate/rate limits and thrown handlers are observable without sleeps', async t => {
  const app = withApp(t, { config: { processor: { rateLimit: { sender: { max: 1, windowMs: 1000 } } } } });
  const router = Router.create({ events: ['message.create'] });
  router.use('boom', () => () => {
    throw new Error('broken feature');
  });
  await app.mount({ responseRouter: router.define });
  await assert.rejects(app.dispatch(app.events.groupMessage({ text: 'boom' })), /broken feature/);
  const blocked = await app.dispatch(app.events.groupMessage({ text: 'boom' }));
  assert.deepEqual(blocked.reasons, ['filtered']);
  await app.clock.advance(1000);
  await assert.rejects(app.dispatch(app.events.groupMessage({ text: 'boom' })), /broken feature/);
});

test('production app registry survives test cache reads and disposal', async t => {
  const production = new ChildrenApp('production-sentinel');
  production.on();
  t.after(() => production.un());
  const app = withApp(t);
  await app.mount({});
  assert.equal(
    app.run(() => new ChildrenApp('production-sentinel').value.name),
    'production-sentinel'
  );
  await app.dispose();
  assert.equal(production.value.name, 'production-sentinel');
});

test('timeouts bound unresolved handlers and lifecycle readiness/disposal execute once', async t => {
  const app = withApp(t, { timeoutMs: 30 });
  const stages = [];
  await app.mount(
    {},
    {
      onReady() {
        stages.push('ready');
      },
      onDispose() {
        stages.push('dispose');
      }
    }
  );
  await assert.rejects(
    app.runHandler(() => new Promise(() => {}), app.events.groupMessage()),
    /timed out/
  );
  await app.dispose();
  await app.dispose();
  assert.deepEqual(stages, ['ready', 'dispose']);
});

test('native API mocks retain real useClient method paths and semantic message content', async t => {
  const { useClient } = await import('alemonjs');
  const app = withApp(t);
  app.apis.on('chat.postMessage', request => {
    assert.deepEqual(request.payload.params, [{ text: 'native' }]);
    return ok({ id: 'native-receipt' });
  });
  const result = await app.runHandler(async () => {
    const [client] = useClient();
    await client.chat.postMessage({ text: 'native' });
    await useMessage()[0].send({
      content: { text: 'semantic', keyboard: { rows: [[{ id: '1', label: '继续', action: { type: 'command', data: '/继续' } }]] } }
    });
  }, app.events.privateMessage({ userId: 'recipient' }));
  assert.equal(result.actions[0].kind, 'api');
  assert.equal(result.actions[0].name, 'chat.postMessage');
  assert.equal(result.messages[0].text, 'semantic');
  assert.deepEqual(result.messages[0].commands, ['/继续']);
  assert.equal(result.actions[result.messages[0].actionIndex].name, 'message.send');
  assert.equal(app.apis.calls.length, 1);
  assert.equal(app.actions.calls.length, 1);
});

test('message/action snapshots survive later mutation and exclude link buttons from commands', async t => {
  const app = withApp(t);
  const format = Format.create().addMarkdown(Format.createMarkdown().addText('original').addButton('link', { type: 'link', data: 'https://example.test' }));
  const result = await app.runHandler(() => {
    void useMessage()[0].send({ format });
    format.addText('later');
  }, app.events.groupMessage());
  assert.equal(result.messages[0].text.includes('later'), false);
  assert.deepEqual(result.messages[0].commands, []);
});

test('real context queue serializes concurrent steps with independent event receipts', async t => {
  const app = withApp(t, { config: { processor: { repeated_user_time: 0 } } });
  const context = createContext({
    name: 'queue',
    events: ['message.create'],
    scope: ['UserId'],
    initialState: { version: 0 },
    handlers: {
      step: async (_event, state) => {
        await Promise.resolve();
        state.version++;
        await useMessage()[0].send({ format: Format.create().addText(String(state.version)) });
      }
    }
  });
  await app.mount({ responseContent: configureContext({ contexts: { context } }) });
  await app.invoke(app.events.groupMessage(), () => context.step());
  const results = await Promise.all([app.dispatch(app.events.groupMessage()), app.dispatch(app.events.groupMessage())]);
  assert.deepEqual(
    results.map(run => run.messages[0].text),
    ['1', '2']
  );
  assert.deepEqual(
    results.map(run => run.actions.length),
    [1, 1]
  );
});

test('virtual timers preserve event hooks, process nested deadlines and surface callback failures', async t => {
  const app = withApp(t);
  await app.invoke(app.events.privateMessage({ userId: 'timer-owner' }), () => {
    scheduleTimeout(async () => {
      await useMessage()[0].send({ format: Format.create().addText('first') });
      scheduleTimeout(() => {
        void useMessage()[0].send({ format: Format.create().addText('second') });
      }, 100);
    }, 100);
  });
  const advanced = await app.clock.advance(200);
  assert.deepEqual(
    advanced.messages.map(message => message.text),
    ['first', 'second']
  );
  assert.ok(advanced.messages.every(message => message.target.targetId === 'timer-owner'));
  app.run(() =>
    scheduleTimeout(() => {
      throw new Error('timer failure');
    }, 1)
  );
  await assert.rejects(app.clock.advance(1), /timer failure/);
});

test('real clock schedules can outlive the opening execution and are cleaned on disposal', async t => {
  const app = withApp(t, { clock: false });
  let done;
  const delivered = new Promise(resolve => (done = resolve));
  app.actions.on('message.send', () => {
    done();
    return ok({ id: 'later' });
  });
  await app.invoke(app.events.privateMessage(), () => {
    scheduleTimeout(() => {
      void useMessage()[0].send({ format: Format.create().addText('later') });
    }, 1);
    scheduleInterval(() => {}, 10000);
  });
  await delivered;
  assert.equal(app.actions.calls.length, 1);
  assert.equal(
    app.run(() => scheduleList().length),
    1
  );
  await app.dispose();
});

test('test cache access cannot replace a production registry cache', async t => {
  const { ResponseRouter, listChildrenApps } = await import('alemonjs');
  const production = new ChildrenApp('cache-sentinel');
  production.register({ responseRouter: { current: [{ handler: async () => () => {} }] } });
  production.on();
  t.after(() => production.un());
  const cache = new ResponseRouter();
  assert.ok(cache.value.some(route => route.appName === 'cache-sentinel'));
  const app = withApp(t);
  await app.mount({ responseRouter: { current: [{ handler: async () => () => {} }] } });
  assert.deepEqual(
    app.run(() => listChildrenApps().map(child => child.name)),
    ['main']
  );
  assert.ok(app.run(() => cache.value.every(route => route.appName === 'main')));
  assert.ok(cache.value.some(route => route.appName === 'cache-sentinel'));
});

test('invalid mocks fail explicitly; error inspection and hanging disposal have bounded behavior', async t => {
  const app = withApp(t, { failOnError: false });
  app.actions.on('message.send', () => undefined);
  const result = await app.runHandler(async () => {
    try {
      await useMessage()[0].send({ format: Format.create().addText('x') });
    } catch {}
  }, app.events.groupMessage());
  assert.match(result.errors[0].message, /Invalid mock results/);
  const stuck = createTestApp({ timeoutMs: 20 });
  await stuck.mount({}, { onDispose: () => new Promise(() => {}) });
  stuck.run(() => scheduleInterval(() => {}, 100));
  await assert.rejects(stuck.dispose(), /disposal timed out/);
  assert.equal(stuck.clock.pending, 0);
});

test('mount accepts an actual defineChildren factory and legacy route definitions', async t => {
  const { defineChildren } = await import('alemonjs');
  const app = withApp(t);
  const phases = [];
  const definition = defineChildren(() => {
    phases.push('factory');
    return {
      onCreated() {
        phases.push('created');
      },
      onMounted() {
        phases.push('mounted');
      },
      register() {
        phases.push('register');
        return {
          response: defineResponse([
            {
              exact: 'hello',
              handler: async () =>
                onResponse('message.create', async () => {
                  await useMessage()[0].send({ format: Format.create().addText('legacy') });
                })
            }
          ])
        };
      },
      onReady() {
        phases.push('ready');
      },
      onDispose() {
        phases.push('dispose');
      }
    };
  });
  await app.mount(definition);
  const result = await app.dispatch(app.events.groupMessage({ text: 'hello' }));
  assert.equal(result.messages[0].text, 'legacy');
  assert.deepEqual(phases, ['factory', 'created', 'register', 'mounted', 'ready']);
  await app.dispose();
  assert.deepEqual(phases, ['factory', 'created', 'register', 'mounted', 'ready', 'dispose']);
});

test('scoped schedules, named-app unload, State and Expose cannot affect other instances', async t => {
  const { Expose, useState } = await import('alemonjs');
  const a = withApp(t);
  const b = withApp(t);
  const expose = Expose.create().provide({
    name: 'test-protocol',
    description: 'test',
    actions: { read: { description: 'read', handler: () => getConfig().value.marker } }
  });
  a.configure({ marker: 'A' });
  b.configure({ marker: 'B' });
  for (const app of [a, b]) {
    await app.mount(
      { expose },
      {
        onReady() {
          scheduleInterval(() => {}, 100);
        }
      },
      'named'
    );
    assert.equal(
      app.run(() => scheduleList('named').length),
      1
    );
  }
  a.run(() => useState('test-switch')[1](false));
  assert.equal(
    b.run(() => useState('test-switch')[0]),
    true
  );
  assert.equal(
    a.run(() => expose.invoke('test-protocol', 'named', 'read')),
    'A'
  );
  assert.equal(
    b.run(() => expose.invoke('test-protocol', 'named', 'read')),
    'B'
  );
  await a.unmount('named');
  assert.equal(a.clock.pending, 0);
  assert.equal(
    a.run(() => expose.list().length),
    0
  );
  assert.equal(
    b.run(() => scheduleList('named').length),
    1
  );
  assert.equal(
    b.run(() => expose.list().length),
    1
  );
});

test('failed creation unwinds owned schedules and disposal hooks before a retry', async t => {
  const app = withApp(t);
  let disposed = 0;
  await assert.rejects(
    app.mount(
      {},
      {
        onCreated() {
          scheduleInterval(() => {}, 100);
          throw new Error('initialization failed');
        },
        onDispose() {
          disposed++;
        }
      },
      'failed'
    ),
    /initialization failed/
  );
  assert.equal(disposed, 1);
  assert.equal(app.clock.pending, 0);
  assert.equal(
    app.run(() => scheduleList().length),
    0
  );
  await app.mount({}, {}, 'failed');
});
