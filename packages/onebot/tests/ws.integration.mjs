import assert from 'node:assert/strict';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import WebSocket, { WebSocketServer } from 'ws';
import { OneBotClient } from '../lib/sdk/wss.js';

globalThis.logger = { info() {}, warn() {}, error() {} };

const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await delay(20);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const listen = async options => {
  const server = new WebSocketServer(options);
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  return { server, url: `ws://127.0.0.1:${address.port}` };
};

const close = async (client, server) => {
  client.__ws?.terminate();
  await new Promise(resolve => server.close(resolve));
};

const freePort = async () =>
  new Promise(resolve => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const v12Forward = async () => {
  const { server, url } = await listen({
    port: 0,
    handleProtocols: protocols => (protocols.has('12') ? '12' : false)
  });
  server.on('connection', ws => {
    ws.send(
      JSON.stringify({
        type: 'meta',
        detail_type: 'connect',
        self: { platform: 'qq', user_id: '9007199254740993' },
        version: { onebot_version: '12', impl: 'fixture' }
      })
    );
    ws.on('message', raw => {
      const request = JSON.parse(raw.toString());
      ws.send(JSON.stringify({ retcode: 0, data: { action: request.action }, echo: request.echo }));
    });
  });
  const client = new OneBotClient({ url, access_token: '', reverse_enable: false, reverse_port: 0, version: 12 });
  client.connect();
  await waitFor(() => client.getConnectionStatus().state === 'ready', 'v12 connection');
  assert.deepEqual(client.getConnectionStatus().bots, [{ id: 'qq:9007199254740993', platform: 'qq', userId: '9007199254740993', online: true }]);
  assert.deepEqual(await client.getV12Status(), { action: 'get_status' });
  await close(client, server);
};

const v12Fallback = async () => {
  const { server, url } = await listen({ port: 0 });
  server.on('connection', ws => ws.send(JSON.stringify({ post_type: 'meta_event', meta_event_type: 'lifecycle', self_id: '1' })));
  const client = new OneBotClient({ url, access_token: '', reverse_enable: false, reverse_port: 0, version: 12 });
  client.connect();
  await waitFor(() => client.getConnectionStatus().fallback && client.getConnectionStatus().state === 'ready', 'v11 fallback');
  const status = client.getConnectionStatus();
  assert.equal(status.activeVersion, 11);
  assert.equal(status.fallback, true);
  await close(client, server);
};

const v12Reverse = async () => {
  const port = await freePort();
  const client = new OneBotClient({ url: '', access_token: 'secret', reverse_enable: true, reverse_port: port, version: 12 });
  client.connect();
  await delay(30);
  const rejected = new WebSocket(`ws://127.0.0.1:${port}`, ['12']);
  await new Promise(resolve => rejected.once('close', resolve));
  const remote = new WebSocket(`ws://127.0.0.1:${port}`, ['12'], { headers: { Authorization: 'Bearer secret' } });
  await new Promise((resolve, reject) => {
    remote.once('open', resolve);
    remote.once('error', reject);
  });
  remote.send(
    JSON.stringify({
      type: 'meta',
      detail_type: 'connect',
      self: { platform: 'qq', user_id: '2' },
      version: { onebot_version: '12' }
    })
  );
  await waitFor(() => client.getConnectionStatus().state === 'ready', 'authenticated reverse v12 connection');
  assert.equal(client.getConnectionStatus().bots[0]?.id, 'qq:2');
  remote.terminate();
};

try {
  await v12Forward();
  await v12Fallback();
  await v12Reverse();
  console.log('OneBot WebSocket integration fixtures passed');
} finally {
  // Reconnect timers deliberately exist in the client; this fixture owns its process.
  process.exit(process.exitCode ?? 0);
}
