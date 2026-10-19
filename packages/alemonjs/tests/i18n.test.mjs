import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createTestApp } from 'alemonjs/testing';
import { getLanguage, withLanguage, translate, Router, useUser, shutdownLogger } from 'alemonjs';
import { validateRouteArgs } from '../lib/application/router/validator.js';
import { checkFallbackHint } from '../lib/application/router/fallback.js';
after(() => shutdownLogger());

function appFor(t, config = {}) {
  const app = createTestApp({ config });
  t.after(() => app.dispose());
  return app;
}

const schema = {
  usage: 'level <value>',
  args: [{ name: 'value', rules: [{ required: true }, { type: 'number', min: 1, max: 8 }] }]
};

test('defaults to Chinese and reads language configuration updates', t => {
  const app = appFor(t);
  assert.equal(app.run(getLanguage), 'zh-CN');
  assert.equal(app.run(() => validateRouteArgs(['abc'], schema)).error, '参数「value」必须是数字');
  app.configure({ language: 'en-US' });
  assert.equal(app.run(getLanguage), 'en-US');
  assert.equal(app.run(() => validateRouteArgs(['9'], schema)).error, 'Argument "value" must not exceed 8');
  app.configure({ language: 'unsupported' });
  assert.equal(app.run(getLanguage), 'zh-CN');
});

test('nested asynchronous overrides restore the language and isolate concurrent requests', async t => {
  const app = appFor(t);
  const values = await app.run(() =>
    Promise.all(
      ['en-US', 'zh-CN'].map(language =>
        withLanguage(language, async () => {
          await Promise.resolve();
          const before = getLanguage();
          await withLanguage(language === 'en-US' ? 'zh-CN' : 'en-US', async () => {
            await Promise.resolve();
            assert.notEqual(getLanguage(), before);
          });
          assert.equal(getLanguage(), before);
          return translate('validation.required', { arg: 'name' });
        })
      )
    )
  );
  assert.deepEqual(values, ['name is required', 'name是必填的']);
  assert.equal(app.run(getLanguage), 'zh-CN');
  assert.throws(
    () =>
      app.run(() =>
        withLanguage('en-US', () => {
          throw new Error('test');
        })
      ),
    /test/
  );
  assert.equal(app.run(getLanguage), 'zh-CN');
});

test('separate app configurations do not share languages', async t => {
  const zh = appFor(t);
  const en = appFor(t, { language: 'en-US' });
  assert.deepEqual(
    await Promise.all([
      zh.run(async () => {
        await Promise.resolve();
        return getLanguage();
      }),
      en.run(async () => {
        await Promise.resolve();
        return getLanguage();
      })
    ]),
    ['zh-CN', 'en-US']
  );
});

test('English validation covers required, count, pattern, enum and range errors; custom copy is preserved', t => {
  const app = appFor(t, { language: 'en-US' });
  app.run(() => {
    assert.equal(validateRouteArgs([], schema).error, 'Argument "value" is required');
    assert.equal(validateRouteArgs(['1', '2'], schema).error, 'Maximum number of arguments: 1');
    for (const [rule, value, expected] of [
      [{ pattern: /^a$/ }, 'b', 'Argument "value" has an invalid format'],
      [{ type: 'enum', enum: ['a', 'b'] }, 'c', 'Argument "value" must be one of: a / b'],
      [{ type: 'range' }, 'x', 'Argument "value" must be a range, for example 1-10'],
      [{ type: 'range' }, '2-1', 'Argument "value" must start at or before its end'],
      [{ type: 'range', min: 2 }, '1-3', 'Argument "value" must be at least 2'],
      [{ type: 'range', max: 2 }, '1-3', 'Argument "value" must not exceed 2'],
      [{ required: true, type: 'rest' }, '', 'Argument "value" is required']
    ]) {
      assert.equal(validateRouteArgs([value], { args: [{ name: 'value', rules: [rule] }] }).error, expected);
    }
    assert.equal(validateRouteArgs(['x'], { args: [{ name: 'value', rules: [{ type: 'number', message: '应用自定义' }] }] }).error, '应用自定义');
    assert.equal(checkFallbackHint('我 是 张三', ['我']).message, 'Your input is closest to `我`. Please use that command.');
    assert.equal(translate('arg.named', { name: '{index}$&' }), 'Argument "{index}$&"');
  });
});

for (const [language, expected] of [
  ['zh-CN', ['我已经识别', '参数「value」必须是数字', '参数说明：']],
  ['en-US', ['I recognized the command', 'Argument "value" must be a number', 'Arguments:', 'required, number, minimum 1, maximum 8']]
]) {
  test(`actual router replies use ${language}, including schema hints`, async t => {
    const app = appFor(t, { language });
    const router = Router.create({ events: ['message.create'] });
    router.use({ path: 'level', schema }, () => () => {});
    await app.mount({ responseRouter: router.define });
    const result = await app.dispatch(app.events.groupMessage({ text: 'level abc' }));
    assert.equal(result.messages.length, 1);
    for (const text of expected) assert.ok(result.messages[0].text.includes(text), result.messages[0].text);
  });
}

test('framework hook failures use the selected language', async t => {
  const app = appFor(t);
  assert.equal((await app.run(() => useUser()[0].info({ userId: '' }))).message, '缺少 UserId');
  assert.equal((await app.run(() => withLanguage('en-US', () => useUser()[0].info({ userId: '' })))).message, 'Missing UserId');
});

test('HTTP response handlers translate framework copy from current configuration', async t => {
  const { default: router } = await import('../lib/application/runtime/http/routers/router.js');
  const app = appFor(t);
  const online = router.stack.find(layer => layer.path === '/api/online').stack[0];
  const missing = router.stack.find(layer => layer.path === '/api/runtime/apps/:app').stack[0];
  for (const [language, onlineText, missingText] of [
    ['zh-CN', '服务在线', '应用未注册'],
    ['en-US', 'Service online', 'Application is not registered']
  ]) {
    app.configure({ language });
    const ctx = { params: { app: 'nonexistent-i18n-test-app' } };
    await app.run(() => online(ctx));
    assert.equal(ctx.body.message, onlineText);
    await app.run(() => missing(ctx));
    assert.equal(ctx.status, 404);
    assert.equal(ctx.body.message, missingText);
  }
});
