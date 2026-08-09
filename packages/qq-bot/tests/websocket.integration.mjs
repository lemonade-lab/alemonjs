import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocketServer } from 'ws';

const configPath = resolve(process.cwd(), 'alemon.config.yaml');
const createdConfig = !existsSync(configPath);
const sessionPath = resolve(process.cwd(), '.data', 'qq-bot', 'sessions', 'app.json');
const createdSession = !existsSync(sessionPath);
const { QQBotClients } = await import('../lib/sdk/client.websoket.js');
const { FileSessionStore } = await import('../lib/sdk/session.js');
const { QQBotRegistry } = await import('../lib/sdk/registry.js');
const { GROUP_AT_MESSAGE_CREATE } = await import('../lib/sends.js');

const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 180; attempt++) {
    if (predicate()) return;
    await delay(20);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const server = new WebSocketServer({ port: 0 });
await new Promise(resolve => server.once('listening', resolve));
const { port } = server.address();
let connections = 0;
let sawResume = false;

server.on('connection', ws => {
  connections++;
  ws.send(JSON.stringify({ op: 10, d: { heartbeat_interval: 1_000 } }));
  ws.on('message', raw => {
    const packet = JSON.parse(raw.toString());
    if (packet.op === 1) ws.send(JSON.stringify({ op: 11, d: null }));
    if (connections === 1 && packet.op === 2) {
      ws.send(JSON.stringify({ op: 0, t: 'READY', s: 42, d: { session_id: 'session-fixture' } }));
      setTimeout(() => ws.terminate(), 30);
    }
    if (connections > 1 && packet.op === 6) {
      sawResume = packet.d.session_id === 'session-fixture' && packet.d.seq === 42;
      ws.send(JSON.stringify({ op: 0, t: 'RESUMED', s: 43, d: {} }));
    }
  });
});

const client = new QQBotClients({ app_id: 'app', secret: 'secret', intents: [] });
client.getAuthentication = async () => ({ access_token: 'token', expires_in: 3_600 });
client.gateway = async () => ({ url: `ws://127.0.0.1:${port}` });
client.connect();

let exitCode = 0;
try {
  await waitFor(() => client.getConnectionStatus().state === 'ready' && client.getConnectionStatus().resumed, 'gateway resume');
  const status = client.getConnectionStatus();
  assert.equal(sawResume, true);
  assert.equal(status.sessionId, 'session-fixture');
  assert.equal(status.sequence, 43);
  let upload;
  let sent;
  const mediaResult = await GROUP_AT_MESSAGE_CREATE(
    {
      postRichMediaByGroup: async (_id, data) => {
        upload = data;
        return { file_info: 'file-info' };
      },
      groupOpenMessages: async (_id, data) => {
        sent = data;
        return { id: 'message-id' };
      }
    },
    { ChannelId: 'group', MessageId: 'message' },
    [{ type: 'Audio', value: 'base64://YXVkaW8=' }]
  );
  assert.equal(upload.file_type, 3);
  assert.equal(sent.media.file_info, 'file-info');
  assert.deepEqual(mediaResult[0].data, { id: 'message-id' });

  const storeRoot = resolve(process.cwd(), '.data', 'qq-bot', 'sessions-test-fixture');
  rmSync(storeRoot, { recursive: true, force: true });
  const store = new FileSessionStore(storeRoot);
  await store.save({ botId: 'persisted', sessionId: 'session', sequence: 7 });
  assert.deepEqual(await store.load('persisted'), { botId: 'persisted', sessionId: 'session', sequence: 7 });
  const staleSave = store.save({ botId: 'stale', sessionId: 'old', sequence: 1 });
  const invalidate = store.clear('stale');
  await Promise.all([staleSave, invalidate]);
  assert.equal(await store.load('stale'), null, 'invalid session clear must win over queued saves');
  rmSync(storeRoot, { recursive: true, force: true });

  const streamPackets = [];
  client.groupService = async request => {
    streamPackets.push(request.data);
    return {};
  };
  const { streamId } = client.streamOpen({ BotId: 'app', userOpenId: 'user', msgId: 'source' });
  await Promise.all([client.streamUpdate(streamId, 'first'), client.streamUpdate(streamId, 'latest')]);
  await client.streamComplete(streamId);
  assert.equal(streamPackets.at(-1).input_state, 10);
  assert.equal(streamPackets.at(-1).content_raw, 'latest');
  assert.equal(
    streamPackets.some(packet => packet.content_raw === 'latest'),
    true
  );
  assert.equal(
    streamPackets.every(packet => packet.content_type === 'markdown'),
    true
  );

  let actionHandler;
  let apiHandler;
  const fakeCbp = {
    send() {},
    onactions(handler) {
      actionHandler = handler;
    },
    onapis(handler) {
      apiHandler = handler;
    }
  };
  const registry = new QQBotRegistry('bot-a', fakeCbp);
  const botA = registry.add('bot-a', { app_id: 'bot-a', secret: 'a', intents: [] });
  const botB = registry.add('bot-b', { app_id: 'bot-b', secret: 'b', intents: [] });
  let routedBot = '';
  botA.groupOpenMessages = async () => {
    routedBot = 'bot-a';
    return { id: 'a' };
  };
  botB.groupOpenMessages = async () => {
    routedBot = 'bot-b';
    return { id: 'b' };
  };
  await new Promise(resolve =>
    actionHandler(
      {
        action: 'message.send.target',
        payload: { target: { scope: 'group', targetId: 'group', BotId: 'bot-b' }, params: { format: [{ type: 'Text', value: 'hello' }] } }
      },
      () => resolve()
    )
  );
  assert.equal(routedBot, 'bot-b', 'explicit BotId must override default_bot');
  let streamRoutedBot = '';
  botA.streamUpdate = async () => {
    streamRoutedBot = 'bot-a';
  };
  botB.streamUpdate = async () => {
    streamRoutedBot = 'bot-b';
  };
  let routedStreamId;
  await new Promise(resolve =>
    apiHandler(
      {
        payload: { key: 'streamOpen', params: [{ BotId: 'bot-b', userOpenId: 'user', msgId: 'source' }] }
      },
      results => {
        routedStreamId = results[0].data.streamId;
        resolve();
      }
    )
  );
  await new Promise(resolve =>
    apiHandler(
      {
        payload: { key: 'streamUpdate', params: [routedStreamId, 'latest'] }
      },
      () => resolve()
    )
  );
  assert.equal(streamRoutedBot, 'bot-b', 'stream updates must remain bound to the Bot that opened them');
  registry.disconnect();
  console.log('QQ Bot WebSocket resume fixture passed');
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  client.disconnect();
  await new Promise(resolve => server.close(resolve));
  if (createdConfig && existsSync(configPath)) rmSync(configPath);
  if (createdSession && existsSync(sessionPath)) rmSync(sessionPath);
  process.exit(exitCode);
}
