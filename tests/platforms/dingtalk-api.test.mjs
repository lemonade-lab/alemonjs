import test from 'node:test';
import assert from 'node:assert/strict';
import { createRobotApi, robotRoutes } from '../../packages/dingtalk/src/api.ts';
import { createDriver } from '../../packages/dingtalk/src/driver.ts';

test('DingTalk named robot API preserves GET queries, PUT bodies and native results', async () => {
  const calls = [];
  const api = createRobotApi(async (...args) => {
    calls.push(args);
    return { native: true };
  });
  assert.equal(Object.keys(api).length, 29);
  assert.deepEqual(await api.batchOTOQuery({ robotCode: 'bot', processQueryKey: 'key+/=' }), { native: true });
  assert.deepEqual(calls[0], ['robot/oToMessages/readStatus?robotCode=bot&processQueryKey=key%2B%2F%3D', undefined, 'GET']);
  const params = { robotCode: 'bot', name: 'name' };
  await api.updateInstalledRobot(params);
  assert.deepEqual(calls[1], ['robot/managements/infos', params, 'PUT']);
  await api.orgGroupRecall({ robotCode: 'bot', openConversationId: 'group', processQueryKeys: ['receipt-key'] });
  assert.equal(calls[2][0], 'robot/groupMessages/recall');
  assert.deepEqual(calls[2][1].processQueryKeys, ['receipt-key']);
  assert.equal(robotRoutes.robotMessageFileDownload[1], 'robot/messageFiles/download');
});

test('DingTalk framework reactions preserve openMsgId and reject negative business results', async t => {
  const original = globalThis.fetch;
  const requests = [];
  let success = true;
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json(String(url).includes('oauth2/accessToken') ? { accessToken: 'token', expireIn: 7200 } : { success });
  };
  t.after(() => { globalThis.fetch = original; });
  class DWClient { registerCallbackListener() {} }
  const driver = createDriver({ config: { client_id: 'c', client_secret: 's', robot_code: 'bot' } }, { DWClient });
  await driver.actions['reaction.add']({ ChannelId: 'conversation', MessageId: 'open-message', EmojiId: 'OK' });
  assert.deepEqual(requests[1].body, {
    robotCode: 'bot', openConversationId: 'conversation', openMsgId: 'open-message', emotionName: 'OK'
  });
  assert.match(requests[1].url, /robot\/emotion\/reply$/);
  success = false;
  await assert.rejects(driver.actions['reaction.remove']({ ChannelId: 'conversation', MessageId: 'm', EmojiId: 'OK' }), /rejected/);
  assert.equal(driver.actions['message.delete'], undefined);
});

test('DingTalk maps image download codes and rich text without exposing reply credentials', () => {
  const handlers = {};
  const events = [];
  class DWClient {
    registerCallbackListener(topic, handler) { handlers[topic] = handler; }
    socketCallBackResponse() {}
  }
  createDriver({
    config: { client_id: 'c', client_secret: 's', robot_code: 'bot' },
    emit: event => events.push(event), ready() {}
  }, { DWClient, TOPIC_ROBOT: 'robot', TOPIC_CARD: 'card' });
  handlers.robot({ headers: { messageId: 'frame' }, data: JSON.stringify({
    msgId: 'm', senderStaffId: 'u', msgtype: 'richText', isInAtList: false,
    content: { richText: [{ text: 'hello' }, { downloadCode: 'download' }] },
    sessionWebhook: 'secret'
  }) });
  assert.equal(events[0].text, 'hello');
  assert.deepEqual(events[0].media, [{ Type: 'image', FileId: 'download' }]);
  assert.equal(events[0].atMe, false);
  assert.equal(events[0].raw.sessionWebhook, undefined);
});
