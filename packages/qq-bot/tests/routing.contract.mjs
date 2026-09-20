import assert from 'node:assert/strict';
import { QQBotAPI } from '../lib/sdk/api.js';
import { QQBotRegistry } from '../lib/sdk/registry.js';

const sdk = new QQBotAPI({ app_id: 'test' });
const requests = [];
sdk.groupService = async request => {
  requests.push(request);
  return { id: 'stream-message' };
};
await sdk.sendTyping({ userOpenId: 'u', msgId: 'm', durationSec: 12 });
assert.equal(requests.at(-1).url, '/v2/users/u/messages');
assert.deepEqual(requests.at(-1).data, { msg_id: 'm', msg_type: 6, input_notify: { input_type: 1, input_second: 12 } });
assert.throws(() => sdk.streamOpen({ userOpenId: 'u', msgId: 'm', eventId: 'e' }), /exactly one/);
assert.throws(() => sdk.streamOpen({ userOpenId: 'u' }), /exactly one/);
for (const source of [{ msgId: 'm' }, { eventId: 'e' }]) {
  const { streamId } = sdk.streamOpen({ userOpenId: 'u', ...source });
  await sdk.streamUpdate(streamId, 'hello');
  const update = requests.at(-1);
  await sdk.streamComplete(streamId);
  const complete = requests.at(-1);
  for (const packet of [update, complete]) {
    assert.equal(packet.url, '/v2/users/u/stream_messages');
    assert.equal(packet.data.msg_id, source.msgId);
    assert.equal(packet.data.event_id, source.eventId);
    assert.equal(Object.hasOwn(packet.data, 'msg_id'), Boolean(source.msgId));
    assert.equal(Object.hasOwn(packet.data, 'event_id'), Boolean(source.eventId));
  }
  assert.equal(update.data.index, 0);
  assert.equal(complete.data.index, 1);
  assert.equal(complete.data.stream_msg_id, 'stream-message');
  assert.equal(complete.data.input_state, 10);
  await assert.rejects(() => sdk.streamUpdate(streamId, 'late'), /expired/);
}
// Cancellation while an update is in flight must prevent a trailing completion packet.
let finishUpdate;
let cancelRequests = 0;
const cancelling = new QQBotAPI({ app_id: 'cancel' });
cancelling.groupService = () => {
  cancelRequests++;
  return new Promise(resolve => {
    finishUpdate = resolve;
  });
};
const pendingStream = cancelling.streamOpen({ userOpenId: 'u', msgId: 'm' }).streamId;
const pendingUpdate = cancelling.streamUpdate(pendingStream, 'pending');
const pendingComplete = cancelling.streamComplete(pendingStream);
const rejectedComplete = assert.rejects(() => pendingComplete, /expired/);
cancelling.streamCancel(pendingStream);
finishUpdate({ id: 'partial' });
await pendingUpdate;
await rejectedComplete;
assert.equal(cancelRequests, 1);
let onAction;
const registry = new QQBotRegistry('a', {
  send() {},
  onactions(fn) {
    onAction = fn;
  },
  onapis() {}
});
try {
  const a = registry.add('a', { app_id: 'a', secret: 'a', intents: [] });
  const b = registry.add('b', { app_id: 'b', secret: 'b', intents: [] });
  const selected = [];
  for (const [id, client] of [
    ['a', a],
    ['b', b]
  ]) {
    client.groupService = async request => {
      selected.push([id, request]);
      return { id: 'sent' };
    };
  }
  const dispatch = data => new Promise(resolve => onAction(data, resolve));
  const result = await dispatch({
    action: 'message.send',
    payload: {
      BotId: 'a',
      target: { scope: 'group', targetId: 'g', BotId: 'a' },
      event: { BotId: 'a', Target: { scope: 'group', targetId: 'g', BotId: 'a' }, _tag: 'GROUP_AT_MESSAGE_CREATE', MessageId: 'source-a' },
      params: { target: { scope: 'group', targetId: 'g', BotId: 'b' }, content: { text: 'hello' } }
    }
  });
  assert.equal(result[0].code, 2000);
  assert.equal(selected.at(-1)[0], 'b');
  assert.equal(selected.at(-1)[1].data.msg_id, undefined);
  const status = await dispatch({ action: 'connection.status', payload: { target: { scope: 'group', targetId: 'g', BotId: 'b' } } });
  assert.deepEqual(
    status[0].data.bots.map(bot => bot.BotId),
    ['b']
  );
  const before = selected.length;
  const unknown = await dispatch({ action: 'connection.gateway', payload: { BotId: 'missing', params: {} } });
  assert.equal(unknown[0].code, 4001);
  assert.equal(selected.length, before);
} finally {
  registry.disconnect();
}
console.log('Verified SDK typing/stream protocol, exclusive reply IDs, registry target precedence and cross-bot reply isolation.');
process.exit(0);
