import assert from 'node:assert/strict';
import { QQBotAPI } from '../lib/sdk/api.js';
import { register } from '../lib/register.js';

const sdk = new QQBotAPI({ app_id: 'app' });
let finish;
let completes = 0;
sdk.groupService = async () => {
  completes++;
  return new Promise(resolve => {
    finish = resolve;
  });
};
const id = sdk.streamOpen({ userOpenId: 'u', msgId: 'm' }).streamId;
const first = sdk.streamComplete(id);
const second = sdk.streamComplete(id);
await Promise.resolve();
assert.equal(completes, 1, 'Concurrent complete calls share one request');
await assert.rejects(() => sdk.streamUpdate(id, 'late'), /completing/);
finish({ id: 'done' });
assert.deepEqual(await Promise.all([first, second]), [{ id: 'done' }, { id: 'done' }]);

const packets = [];
let rejectUpdate = true;
let rejectComplete = true;
sdk.groupService = async request => {
  packets.push(request.data);
  if (request.data.input_state === 1 && rejectUpdate) {
    rejectUpdate = false;
    throw new Error('update failed');
  }
  if (request.data.input_state === 10 && rejectComplete) {
    rejectComplete = false;
    throw new Error('complete failed');
  }
  return { id: 'retry-stream' };
};
const retry = sdk.streamOpen({ userOpenId: 'u', eventId: 'event' }).streamId;
await assert.rejects(() => sdk.streamUpdate(retry, 'first'), /update failed/);
await sdk.streamUpdate(retry, 'latest');
assert.deepEqual(
  packets.map(p => p.index),
  [0, 0],
  'Failed update must not consume an index'
);
assert.equal(packets.at(-1).content_raw, 'latest');
await assert.rejects(() => sdk.streamComplete(retry), /complete failed/);
await sdk.streamComplete(retry);
assert.deepEqual(
  packets.map(p => p.index),
  [0, 0, 1, 1]
);
assert.equal(packets.at(-1).stream_msg_id, 'retry-stream');
assert.equal(packets.at(-1).content_raw, 'latest');

const handlers = new Map();
const events = [];
const client = new QQBotAPI({ app_id: 'app' });
client.on = (name, handler) => handlers.set(name, handler);
const adapter = register(client, {
  botId: 'app',
  cbp: {
    send(event) {
      events.push(event);
    },
    onactions() {},
    onapis() {}
  }
});
let ackRequests = 0;
let finishAck;
client.groupService = async () => {
  ackRequests++;
  return new Promise(resolve => {
    finishAck = resolve;
  });
};
const automatic = handlers.get('INTERACTION_CREATE')({ id: 'same', type: 11, scene: 'c2c', user_openid: 'u', data: { resolved: {} } });
const manual = new Promise(resolve =>
  adapter.onAction({ action: 'interaction.ack', payload: { BotId: 'app', InteractionId: 'same', params: { code: 0 } } }, resolve)
);
await Promise.resolve();
assert.equal(ackRequests, 1, 'Automatic and manual ACKs share the in-flight request');
finishAck({});
await automatic;
assert.equal((await manual)[0].code, 2000);
assert.equal(events.at(-1).Interaction.acknowledged, true);
await client.interactionResponse('group', 'same', 0);
assert.equal(ackRequests, 1, 'Successful ACK is reused');
await assert.rejects(() => client.interactionResponse('group', 'same', 1), /different code/);
assert.equal(ackRequests, 1);
let fail = true;
client.groupService = async () => {
  ackRequests++;
  if (fail) {
    fail = false;
    throw new Error('ACK failed');
  }
  return {};
};
await assert.rejects(() => client.interactionResponse('group', 'retry-ack', 0), /ACK failed/);
await client.interactionResponse('group', 'retry-ack', 0);
assert.equal(ackRequests, 3, 'Failed ACK may be retried');
await assert.rejects(() => client.interactionResponse('group', 'invalid', 6), /Invalid/);
assert.equal(ackRequests, 3);
console.log('Verified concurrent stream completion, retry indexes, completion recovery, shared auto/manual ACKs and retryable ACK failures.');
process.exit(0);
