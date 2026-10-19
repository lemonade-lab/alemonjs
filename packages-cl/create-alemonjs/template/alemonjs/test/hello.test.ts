import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createResult, ResultCode, shutdownLogger } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';
import hello from '../src/response/hello';

after(() => shutdownLogger());

for (const user of [{ UserId: '001', UserName: '宋玉' }, { UserId: '001' }]) {
  test(`hello replies using ${user.UserName ? 'nickname' : 'user ID'}`, async t => {
    const app = createTestApp();
    t.after(() => app.dispose());
    app.actions.on('mention.get', () => [createResult(ResultCode.Ok, 'OK', [user])]);

    const result = await app.runHandler(hello, app.events.groupMessage({ groupId: 'group-1' }));
    assert.equal(result.messages.length, 1);
    assert.equal(result.messages[0].text, `hello, ${user.UserName || user.UserId}!`);
    assert.equal(result.messages[0].target?.targetId, 'group-1');
  });
}

test('hello explains a missing mention without sending a greeting', async t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  app.actions.on('mention.get', () => [createResult(ResultCode.Ok, 'OK', [])]);

  const result = await app.runHandler(hello, app.events.privateMessage());
  assert.deepEqual(result.messages.map(message => message.text), ['没有找到@用户']);
});
