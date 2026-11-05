import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { Router, shutdownLogger } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';

after(() => shutdownLogger());

async function check(t, rule, cases, platform = 'qq-bot') {
  const app = createTestApp();
  t.after(() => app.dispose());
  const router = Router.create({ events: ['message.create'] });
  let calls = 0;
  router.group({ routeText: { prefixes: ['/修仙'], stripPrefix: true, ...rule } }).use('签到', () => () => {
    calls++;
  });
  await app.mount({ responseRouter: router.define });
  for (const [text, expected] of cases) {
    await app.clock.advance(1000);
    const before = calls;
    await app.dispatch(app.events.groupMessage({ text, platform }));
    assert.equal(calls - before, expected ? 1 : 0, JSON.stringify(text));
  }
}

for (const space of [undefined, false, true]) {
  test(`routeText.space=${space} enforces separator through mounted router`, async t => {
    await check(t, space === undefined ? {} : { space }, [
      ['/修仙签到', !space],
      ['/修仙 签到', !!space],
      ['/修仙\t签到', !!space],
      ['/修仙  签到', !!space],
      ['/修仙\n签到', false],
      ['/修仙 \n签到', false],
      ['/修仙', false],
      ['/签到', false],
      ['签到', false],
      [space ? ' /修仙 签到 2 ' : ' /修仙签到 2 ', true]
    ]);
  });
}

test('allowBare does not bypass malformed prefixed commands', async t => {
  await check(t, { space: true, allowBare: true }, [
    ['签到', true],
    ['/修仙签到', false],
    ['/修仙 签到', true]
  ]);
});

test('platform false overrides parent true', async t => {
  await check(t, { space: true, byPlatform: { 'qq-bot': { space: false } } }, [
    ['/修仙签到', true],
    ['/修仙 签到', false]
  ]);
});

test('platform inherits parent space when omitted', async t => {
  await check(t, { space: true, byPlatform: { 'qq-bot': { allowBare: false } } }, [
    ['/修仙签到', false],
    ['/修仙 签到', true]
  ]);
});

test('overlapping prefixes prefer longest match', async t => {
  await check(t, { prefixes: ['/', '/修仙'], space: true }, [['/修仙 签到', true]]);
});

test('res inherits defaults, tests normalized text, preserves source and falls through', async t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  const seen = [];
  const router = Router.create({
    events: ['message.create'],
    routeText: {
      prefixes: ['/修仙'],
      space: true,
      stripPrefix: true,
      allowBare: false
    }
  });
  router.res({ regular: /^签到$/ }, () => (event, next) => {
    seen.push([event.MessageText, event.__route.text]);
    next();
  });
  router.res({ routeText: {}, regular: /^\/修仙 签到$/ }, () => event => {
    seen.push(event.__route.text);
  });
  await app.mount({ responseRouter: router.define });
  await app.dispatch(app.events.groupMessage({ text: '/修仙 签到' }));
  assert.deepEqual(seen, [['/修仙 签到', '签到'], '/修仙 签到']);
  for (const text of ['/修仙签到', '/签到', '签到', '/修仙 背包']) {
    await app.clock.advance(1000);
    await app.dispatch(app.events.groupMessage({ text }));
  }
  assert.equal(seen.length, 2);
});

test('res overrides Router default and leaves non-text events unrestricted', async t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  let calls = 0;
  const router = Router.create({ routeText: { prefixes: ['/修仙'], space: true, stripPrefix: true } });
  router.res({ events: ['message.create'], routeText: { prefixes: ['#'], stripPrefix: true }, regular: /^签到$/ }, () => () => {
    calls++;
  });
  router.res({ events: ['guild.join'] }, () => () => {
    calls++;
  });
  await app.mount({ responseRouter: router.define });
  await app.dispatch(app.events.groupMessage({ text: '#签到' }));
  await app.dispatch(app.events.event('guild.join'));
  assert.equal(calls, 2);
});

test('Router default routeText also applies to direct use and groups', async t => {
  for (const grouped of [false, true]) {
    const app = createTestApp();
    t.after(() => app.dispose());
    let calls = 0;
    const router = Router.create({ events: ['message.create'], routeText: { prefixes: ['/修仙'], space: true, stripPrefix: true } });
    (grouped ? router.group({}) : router).use('签到', () => () => {
      calls++;
    });
    await app.mount({ responseRouter: router.define });
    await app.dispatch(app.events.groupMessage({ text: '/修仙 签到' }));
    assert.equal(calls, 1);
  }
});
