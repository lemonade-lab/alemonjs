import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { Router, Format, useMessage, shutdownLogger } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';
import { normalizeAppsConfig } from '../lib/common/apps-config.js';
after(() => shutdownLogger());

const command = { prefix: '/修仙', space: true, format: { enabled: true, match: '^[/#]\\s*', replacement: '' } };

test('configuration validates and retains command rules', () => {
  assert.deepEqual(normalizeAppsConfig({ main: { command } })[0].command, command);
  for (const invalid of [
    { prefix: '' },
    { prefix: '/x', space: 'true' },
    { prefix: '/x', format: { enabled: true } },
    { prefix: '/x', format: { enabled: true, match: '[' } }
  ]) {
    assert.throws(() => normalizeAppsConfig({ main: { command: invalid } }), /invalid command/);
  }
});

test('forced prefix overrides local DSL and res rules', async t => {
  for (const res of [false, true]) {
    const app = createTestApp({ config: { apps: { main: { command } } } });
    t.after(() => app.dispose());
    const router = Router.create({ events: ['message.create'] });
    let count = 0;
    const handler = () => () => {
      count++;
    };
    if (res) router.res({ regular: /^签到$/, routeText: { prefixes: ['#'], allowBare: true } }, handler);
    else router.group({ routeText: { prefixes: ['#'], allowBare: true } }).use('签到', handler);
    await app.mount({ responseRouter: router.define });
    for (const [text, expected] of [
      ['#签到', 0],
      ['签到', 0],
      ['/修仙签到', 0],
      ['/修仙 签到', 1]
    ]) {
      await app.clock.advance(1000);
      await app.dispatch(app.events.groupMessage({ text }));
      assert.equal(count, expected);
    }
  }
});

test('send pipeline converts nested Format and MD buttons without mutating reused values', async t => {
  const app = createTestApp({ config: { apps: { main: { command }, other: { command: { ...command, prefix: '/其他', space: false } } } } });
  t.after(() => app.dispose());
  const md = Format.createMarkdown()
    .addButton('签到', { data: '#签到' })
    .addButton('外部', { data: '/背包 2', commandTarget: 'other' })
    .addButton('保留', { data: '/签到', commandTarget: false })
    .addButton('链接', { data: '/签到', type: 'link' })
    .addButton('未匹配', { data: '奇怪签到' });
  const format = Format.create().addMarkdown(md).addButtonGroup(Format.createButtonGroup().addButton('签到', '/签到'));
  const before = JSON.stringify(format.value);
  for (let i = 0; i < 2; i++) {
    const result = await app.invoke(app.events.groupMessage(), async () => {
      await useMessage()[0].send({ format });
    });
    const serialized = JSON.stringify(result);
    assert.ok(serialized.includes('/修仙 签到'));
    assert.ok(serialized.includes('/其他背包 2'));
    assert.ok(serialized.includes('奇怪签到'));
    assert.equal(JSON.stringify(format.value), before);
  }
});

test('output opt-in, replacement captures and start-only matching', async t => {
  const { transformCommandButtons } = await import('../lib/application/command-policy.js');
  for (const [format, input, expected] of [
    [undefined, '/签到', '/签到'],
    [{ match: '^/' }, '/签到', '/签到'],
    [{ enabled: false, match: '^/' }, '/签到', '/签到'],
    [{ enabled: true, match: '^启动::(.*)$', replacement: '$1' }, '启动::签到', '/修仙 签到'],
    [{ enabled: true, match: '/' }, '路径/签到', '路径/签到'],
    [command.format, '/背包 /道具', '/修仙 背包 /道具']
  ]) {
    const app = createTestApp({ config: { apps: { main: { command: { ...command, format } } } } });
    t.after(() => app.dispose());
    await app.invoke(app.events.groupMessage(), () => {
      const button = { type: 'MD.button', options: { data: input } };
      assert.equal(transformCommandButtons(button).options.data, expected);
      for (const options of [{ type: 'link' }, { type: 'call' }, { commandTarget: false }]) {
        assert.equal(transformCommandButtons({ ...button, options: { data: input, ...options } }).options.data, input);
      }
    });
  }
});

test('stale route context cannot bypass forced prefix or replace current input', async t => {
  const app = createTestApp({ config: { apps: { main: { command } } } });
  t.after(() => app.dispose());
  const router = Router.create({ events: ['message.create'] });
  let calls = 0;
  router.use('签到', () => () => {
    calls++;
  });
  await app.invoke(app.events.groupMessage(), async () => {
    const stale = { text: '签到' };
    for (const text of ['签到', '/修仙 背包', '#签到']) {
      const event = { name: 'message.create', MessageText: text, __route: stale };
      assert.equal(router.match(event).matched, false);
      assert.equal((await router.dispatch(event)).matched, false);
    }
    assert.equal((await router.dispatch({ name: 'message.create', MessageText: '/修仙 签到', __route: { text: '背包' } })).matched, true);
    assert.equal(calls, 1);
  });
});

test('res imports only after matching and preserves selected handler arrays', async t => {
  const app = createTestApp({ config: { apps: { main: { command } } } });
  t.after(() => app.dispose());
  const router = Router.create({ events: ['message.create'] });
  let imports = 0;
  const calls = [];
  router.res({ regular: /^签到$/ }, () => {
    imports++;
    return {
      select: 'message.create',
      current: [
        () => {
          calls.push(1);
          return true;
        },
        () => {
          calls.push(2);
        }
      ]
    };
  });
  await app.mount({ responseRouter: router.define });
  for (const text of ['签到', '无关', '/修仙 背包']) {
    await app.clock.advance(1000);
    await app.dispatch(app.events.groupMessage({ text }));
  }
  assert.equal(imports, 0);
  await app.clock.advance(1000);
  await app.dispatch(app.events.groupMessage({ text: '/修仙 签到' }));
  assert.equal(imports, 1);
  assert.deepEqual(calls, [1, 2]);
});

test('same Router applies the current application policy without leaking contexts', async t => {
  const app = createTestApp({ config: { apps: { a: { command }, b: { command: { ...command, prefix: '/其他' } } } } });
  t.after(() => app.dispose());
  const router = Router.create({ events: ['message.create'] });
  router.use('签到', () => () => {});
  for (const [name, own, other] of [
    ['a', '/修仙 签到', '/其他 签到'],
    ['b', '/其他 签到', '/修仙 签到']
  ]) {
    await app.invoke(
      app.events.groupMessage(),
      () => {
        assert.equal(router.match({ name: 'message.create', MessageText: own }).matched, true);
        assert.equal(router.match({ name: 'message.create', MessageText: other, __route: { text: '签到' } }).matched, false);
      },
      name
    );
  }
});

test('validation and fallback hints contain usable forced commands', async t => {
  const app = createTestApp({ config: { apps: { main: { command } } } });
  t.after(() => app.dispose());
  const router = Router.create({ events: ['message.create'] });
  router.use({ path: '签到', schema: { usage: '签到 <名字>', args: [{ name: '名字', rules: [{ required: true }] }] } }, () => () => {});
  await app.mount({ responseRouter: router.define });
  const invalid = await app.dispatch(app.events.groupMessage({ text: '/修仙 签到' }));
  assert.ok(JSON.stringify(invalid.messages).includes('/修仙 签到'));
  await app.clock.advance(1000);
  const event = app.events.groupMessage({ text: '/修仙 签到 张三' });
  const hint = await app.invoke(event, () => router.handleFallbackEvent(event, () => {}));
  assert.ok(JSON.stringify(hint.messages).includes('/修仙 签到'));
});
