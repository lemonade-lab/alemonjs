import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { Router, useEvent, shutdownLogger } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';
import { formatPolicyCommand } from '../lib/application/command-policy.js';
after(() => shutdownLogger());

for (const hook of [false, true]) {
  test(`res ${hook ? 'Hook' : 'argument'} next stops handler array and forwards flags once`, async t => {
    const app = createTestApp();
    t.after(() => app.dispose());
    const seen = [];
    const router = Router.create({ events: ['message.create'] });
    router.res({}, () => ({
      select: 'message.create',
      current: [
        (_event, next) => {
          seen.push('first');
          const forward = hook ? useEvent()[1] : next;
          forward(true, false);
          forward();
          return true;
        },
        () => {
          seen.push('unexpected');
        }
      ]
    }));
    // Exercise the emitted production wrapper with an observable continuation.
    const handler = await router.values[0].handler();
    await app.invoke(app.events.groupMessage(), async () => {
      await handler({ name: 'message.create', MessageText: '签到' }, (...args) => {
        seen.push(args);
      });
    });
    assert.deepEqual(seen, ['first', [true, false]]);
  });
}

for (const hook of [false, true]) {
  for (const awaited of [false, true]) {
    test(`rewritten command redispatches once: hook=${hook}, await=${awaited}`, async t => {
      const app = createTestApp({ config: { apps: { main: { command: { prefix: '/修仙', space: true } } } } });
      t.after(() => app.dispose());
      const router = Router.create({ events: ['message.create'] });
      let targets = 0;
      router.use('入口', () => async (event, next) => {
        event.MessageText = '/修仙 目标';
        const forward = hook ? useEvent()[1] : next;
        if (awaited) await forward();
        else forward();
      });
      router.use('目标', () => () => {
        targets++;
      });
      await app.mount({ responseRouter: router.define });
      await app.dispatch(app.events.groupMessage({ text: '/修仙 入口' }));
      assert.equal(targets, 1);
    });
  }
}

test('redispatch respects depth zero and cycles terminate', async t => {
  for (const limit of [0, 2]) {
    const app = createTestApp();
    t.after(() => app.dispose());
    const router = Router.create({ events: ['message.create'] });
    const group = router.group({ redispatch: { maxDepth: limit } });
    let calls = 0;
    for (const [from, to] of [
      ['甲', '乙'],
      ['乙', '甲']
    ]) {
      group.use(from, () => async (event, next) => {
        calls++;
        event.MessageText = to;
        await next();
      });
    }
    await app.invoke(app.events.groupMessage(), async () => {
      const result = await router.dispatch({ name: 'message.create', MessageText: '甲' });
      assert.equal(result.reason, 'redispatch_limit');
      assert.equal(calls, limit + 1);
    });
  }
});

test('hints do not mistake a business command for an encoded prefix', async t => {
  const app = createTestApp({ config: { apps: { main: { command: { prefix: '修仙', space: true } } } } });
  t.after(() => app.dispose());
  await app.invoke(app.events.groupMessage(), () => {
    assert.equal(formatPolicyCommand('修仙签到'), '修仙 修仙签到');
  });
});

for (const [limits, expected] of [
  [[5, 5, 5, 5, 5, 5, 5], 6],
  [[1, 5, 5, 5], 2],
  [[5, 0, 5], 2]
]) {
  test(`chain budget is preserved across groups: ${limits}`, async t => {
    const app = createTestApp();
    t.after(() => app.dispose());
    const router = Router.create({ events: ['message.create'] });
    let calls = 0;
    limits.forEach((maxDepth, index) => {
      router.group({ redispatch: { maxDepth } }).use(`c${index}`, () => async (event, next) => {
        calls++;
        event.MessageText = `c${index + 1}`;
        await next();
      });
    });
    await app.invoke(app.events.groupMessage(), async () => {
      const result = await router.dispatch({ name: 'message.create', MessageText: 'c0' });
      assert.equal(result.reason, 'redispatch_limit');
      assert.equal(calls, expected);
    });
  });
}

for (const target of ['目标', '#目标']) {
  test(`redispatch validates target group's prefix: ${target}`, async t => {
    const app = createTestApp();
    t.after(() => app.dispose());
    const router = Router.create({ events: ['message.create'] });
    let calls = 0;
    router.group({ routeText: { prefixes: ['/'], stripPrefix: true, allowBare: false } }).use('入口', () => async (event, next) => {
      event.MessageText = target;
      await next();
    });
    router.group({ routeText: { prefixes: ['#'], stripPrefix: true, allowBare: false } }).use('目标', () => () => {
      calls++;
    });
    await app.mount({ responseRouter: router.define });
    await app.dispatch(app.events.groupMessage({ text: '/入口' }));
    assert.equal(calls, target.startsWith('#') ? 1 : 0);
    await app.invoke(app.events.groupMessage(), async () => {
      const event = { name: 'message.create', MessageText: target, __route: { text: '目标' } };
      assert.equal(router.match(event).matched, target.startsWith('#'));
      assert.equal((await router.dispatch(event)).matched, target.startsWith('#'));
    });
  });
}
