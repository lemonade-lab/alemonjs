import { existsSync, readFileSync as readConfig, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { WebSocketServer } from 'ws';
import { setTimeout as delay } from 'node:timers/promises';
import { QQBotClient } from '../lib/sdk/client.webhook.js';
import { QQBotClients } from '../lib/sdk/client.websoket.js';
import { WebhookAPI } from '../lib/sdk/webhook.secret.js';
import { register } from '../lib/register.js';
import { Router, useEvent, useMenu } from 'alemonjs';
import { createTestApp } from 'alemonjs/testing';
import { createEventEnvelope, normalizeInboundMessage } from '../../alemonjs/lib/common/cbp/normalize.js';
import { setDirectSend } from '../../alemonjs/lib/application/runtime/cbp/processor/transport.js';
import { actionRequestResolves, actionRequestTimeouts } from '../../alemonjs/lib/application/runtime/cbp/processor/request-registry.js';

const configPath = resolve('alemon.config.yaml');
const hadConfig = existsSync(configPath);
process.on('exit', () => {
  if (!hadConfig && existsSync(configPath) && readConfig(configPath, 'utf8').trim() === '{}') rmSync(configPath);
});

const wait = async predicate => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await delay(20);
  }
  throw new Error('Timed out');
};
const events = [];
const attach = client => {
  client.getAuthentication = async () => ({ access_token: 'test', expires_in: 3600 });
  client.interactionResponse = async () => {};
  return register(client, { botId: 'test', cbp: { send: event => events.push(event), onactions() {}, onapis() {} } });
};
const packet = {
  op: 0,
  t: 'INTERACTION_CREATE',
  id: 'envelope',
  s: 2,
  d: { id: 'interaction', scene: 'c2c', user_openid: 'user', type: 11, data: { resolved: { button_id: 'b', button_data: 'click' } } }
};

const unknownPacket = {
  op: 0,
  t: 'ACCOUNT_TEST_EVENT',
  id: 'test-event-envelope',
  s: 4,
  d: { preview: { enabled: true } }
};
const expectedRaw = (botId = 'test') => ({
  name: 'platform.raw',
  Platform: 'qq-bot',
  BotId: botId,
  RawEventType: unknownPacket.t,
  EventId: unknownPacket.id,
  value: unknownPacket.d
});

// Official WebSocket dispatch, using a local gateway with real framing.
const gateway = new WebSocketServer({ port: 0 });
await new Promise(resolve => gateway.once('listening', resolve));
gateway.on('connection', ws => {
  ws.send(JSON.stringify({ op: 10, d: { heartbeat_interval: 1000 } }));
  ws.on('message', raw => {
    const msg = JSON.parse(raw);
    if (msg.op === 1) ws.send(JSON.stringify({ op: 11, d: null }));
    if (msg.op === 2) {
      ws.send(JSON.stringify({ op: 0, t: 'READY', s: 1, d: { session_id: 'test-session' } }));
      ws.send(JSON.stringify(packet));
      ws.send(JSON.stringify({ op: 0, t: 'RESUMED', s: 3, d: {} }));
      ws.send(JSON.stringify(unknownPacket));
      ws.send(JSON.stringify({ op: 0, t: 'SUBSCRIBE_MESSAGE_STATUS', id: 'subscription', s: 5, d: { openid: 'user', result: [] } }));
    }
  });
});
const wsClient = new QQBotClients({
  app_id: 'test',
  secret: 'test',
  intents: ['GROUP_AND_C2C_EVENT', 'INTERACTION'],
  sessionStore: { load: async () => null, save: async () => {}, clear: async () => {} }
});
attach(wsClient);
wsClient.gateway = async () => ({ url: `ws://127.0.0.1:${gateway.address().port}` });
wsClient.connect();
await wait(() => events.some(event => event.name === 'private.interaction.create') && events.some(event => event._tag === 'SUBSCRIBE_MESSAGE_STATUS'));
const wsInteraction = events.find(event => event.name === 'private.interaction.create');
assert.equal(wsInteraction.MessageId, 'envelope');
assert.equal(wsInteraction.InteractionId, 'interaction');
assert(events.some(event => event._tag === 'SUBSCRIBE_MESSAGE_STATUS'));
assert.deepEqual(
  events.filter(event => event.name === 'platform.raw'),
  [expectedRaw()]
);
wsClient.disconnect();
for (const socket of gateway.clients) socket.terminate();
await new Promise(resolve => gateway.close(resolve));

// Signed HTTP Webhook path, not just a direct event-handler invocation.
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const secret = 'test-webhook-secret';
const webhook = new QQBotClient({ app_id: 'test', secret, port: String(port), route: '/webhook' });
const adapter = attach(webhook);
webhook.connect();
const sign = new WebhookAPI({ secret });
const post = async body => {
  const raw = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  return fetch(`http://127.0.0.1:${port}/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-signature-timestamp': timestamp, 'x-signature-ed25519': sign.getSign(timestamp, raw) },
    body: raw
  });
};
const webhookStart = events.length;
assert.equal((await post(packet)).status, 204);
await wait(() => events.slice(webhookStart).some(event => event.name === 'private.interaction.create'));
const webhookInteraction = events.slice(webhookStart).find(event => event.name === 'private.interaction.create');
assert.equal(webhookInteraction.MessageId, 'envelope');
assert.equal(webhookInteraction.InteractionId, 'interaction');
assert.equal((await post({ op: 0, t: 'SUBSCRIBE_MESSAGE_STATUS', id: 'sub', d: { group_openid: 'group', result: [] } })).status, 204);
await wait(() => events.slice(webhookStart).some(event => event._tag === 'SUBSCRIBE_MESSAGE_STATUS' && event.GuildId === 'group'));
assert.equal(events.slice(webhookStart).find(event => event._tag === 'SUBSCRIBE_MESSAGE_STATUS' && event.GuildId === 'group').name, 'notice.create');

const proxy = new QQBotClient({ app_id: 'proxy', secret, ws: `ws://127.0.0.1:${port}` });
register(proxy, { botId: 'proxy', cbp: { send: event => events.push(event), onactions() {}, onapis() {} } });
proxy.connect();
await wait(() => proxy.getConnectionStatus().state === 'ready');
const rawStart = events.length;
assert.equal((await post(unknownPacket)).status, 204);
await wait(() => events.slice(rawStart).filter(event => event.name === 'platform.raw').length === 2);
assert.deepEqual(events.slice(rawStart), [expectedRaw(), expectedRaw('proxy')]);

// Route the CBP event through the framework and read it from the application hook.
const normalized = normalizeInboundMessage(JSON.parse(JSON.stringify(createEventEnvelope(events[rawStart]))));
const app = createTestApp();
const received = [];
const router = Router.create({ events: ['platform.raw'] });
router.res({ events: ['platform.raw'] }, async () => async () => {
  const [{ current }] = useEvent({ selects: 'platform.raw' });
  received.push([current.Platform, current.BotId, current.RawEventType, current.EventId, current.value]);
});
await app.mount({ responseRouter: router.define });
await app.dispatch(normalized.event);
assert.deepEqual(received, [['qq-bot', 'test', unknownPacket.t, unknownPacket.id, unknownPacket.d]]);
await app.dispose();

const withoutSignature = await fetch(`http://127.0.0.1:${port}/webhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(unknownPacket)
});
assert.equal(withoutSignature.status, 400);
assert.equal((await post({ op: 0, t: unknownPacket.t })).status, 400);
assert.equal(events.length, rawStart + 2);

const listPacket = { op: 0, t: 'ACCOUNT_TEST_LIST', d: [1, { enabled: true }] };
assert.equal((await post(listPacket)).status, 204);
await wait(() => events.filter(event => event.RawEventType === listPacket.t).length === 2);
for (const event of events.filter(event => event.RawEventType === listPacket.t)) {
  assert.equal(event.EventId, undefined);
  assert.deepEqual(event.value, listPacket.d);
}

// Real application helper -> AlemonJS sendAction envelope -> adapter -> result.
webhook.menuGet = async () => ({ version: 42, menu: { items: [] } });
setDirectSend(envelope => {
  queueMicrotask(async () => {
    await adapter.onAction({ action: envelope.payload.action, payload: envelope.payload.input }, results => {
      clearTimeout(actionRequestTimeouts.get(envelope.id));
      actionRequestTimeouts.delete(envelope.id);
      actionRequestResolves.get(envelope.id)?.(results);
      actionRequestResolves.delete(envelope.id);
    });
  });
});
const result = await useMenu({ BotId: 'test' })[0].get();
assert.equal(result.code, 2000);
assert.equal(result.data.version, 42);
const wrongBot = await useMenu({ BotId: 'other' })[0].get();
assert.equal(wrongBot.code, 4001);
setDirectSend(null);
console.log('Verified WebSocket, signed Webhook and proxy raw dispatch, application routing, known events and no-useClient Action round trip.');
process.exit(0);
