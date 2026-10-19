import assert from 'node:assert/strict';
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { createServer } from 'node:net';
import { QQBotClient } from '../lib/sdk/client.webhook.js';
import { WebhookAPI } from '../lib/sdk/webhook.secret.js';

// Independent signer: do not use the implementation under test to construct events.
const secret = 'webhook-ingress-test-secret';
const seed = Buffer.from(secret.repeat(2).slice(0, 32));
const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]), format: 'der', type: 'pkcs8' });
const publicKey = createPublicKey(privateKey);
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const client = new QQBotClient({ app_id: 'app', secret, port: String(port), route: '/callback' });
client.getAuthentication = async () => ({ access_token: 'test', expires_in: 3600 });
const seen = [];
const errors = [];
const unhandled = [];
process.on('unhandledRejection', error => unhandled.push(error));
client.on('ERROR', error => errors.push(error.message));
const errorFallback = [];
const originalConsoleError = console.error;
console.error = (...args) => errorFallback.push(args);
client.on('ERROR', async () => {
  throw new Error('error listener failed');
});
let release;
const pending = new Promise(resolve => {
  release = resolve;
});
client.on('TEST', async event => {
  seen.push(event);
  await pending;
});
client.on('TEST', () => {
  throw new Error('sync listener failed');
});
client.on('TEST', async () => {
  throw new Error('async listener failed');
});
client.on('TEST', event => seen.push({ laterListener: event.id }));
client.connect();
const post = (raw, headers = {}) =>
  fetch(`http://127.0.0.1:${port}/callback`, {
    method: 'POST',
    body: raw,
    headers: { 'content-type': 'application/json', ...headers },
    signal: AbortSignal.timeout(2000)
  });
const signed = raw => {
  const timestamp = '1792368000';
  return { 'x-signature-timestamp': timestamp, 'x-signature-ed25519': sign(null, Buffer.from(timestamp + raw), privateKey).toString('hex') };
};
const raw = '{ "op": 0, "t": "TEST", "id": "envelope", "d": { "content": "你好 🌏" } }';
assert.equal((await post(raw, signed(raw))).status, 204, 'ACK must arrive while application listener is pending');
assert.equal(seen[0].content, '你好 🌏');
assert.equal(seen[0].id, 'envelope');
assert.equal(seen[1].laterListener, 'envelope');
assert.deepEqual(errors.sort(), ['async listener failed', 'sync listener failed']);
const count = seen.length;
for (const headers of [
  {},
  { 'x-signature-timestamp': '1', 'x-signature-ed25519': 'xyz' },
  { 'x-signature-timestamp': '1', 'x-signature-ed25519': '0'.repeat(128) }
]) {
  assert.equal((await post(raw, headers)).status, 400);
}
assert.equal((await post(raw.replace('你好', '篡改'), signed(raw))).status, 400);
assert.equal(seen.length, count, 'Unsigned or tampered events never reach listeners');
for (const invalid of ['null', '[]', '{}', '{', '{"op":13}', '{"op":13,"d":{"plain_token":123,"event_ts":"1"}}']) {
  assert.equal((await post(invalid)).status, 400);
}
const badDispatch = JSON.stringify({ op: 0, t: 'TEST', d: [] });
assert.equal((await post(badDispatch, signed(badDispatch))).status, 400);
const challenge = JSON.stringify({ op: 13, d: { plain_token: 'hello', event_ts: '123' } });
const response = await post(challenge);
assert.equal(response.status, 200);
const validation = await response.json();
assert.equal(validation.plain_token, 'hello');
assert(verify(null, Buffer.from('123hello'), publicKey, Buffer.from(validation.signature, 'hex')));
const verifier = new WebhookAPI({ secret });
assert.equal(verifier.validSign(undefined, undefined, undefined), false);
assert.equal(verifier.validSign('1', raw, Buffer.alloc(1)), false);
assert.equal(verifier.validSign('1', raw, '0'.repeat(128) + 'junk'), false);
release();
await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(unhandled, []);
assert.equal(errorFallback.length, 2, 'ERROR listener rejections reach the fallback without recursion');
console.error = originalConsoleError;
console.log('Verified raw UTF-8 signatures, unsigned challenge, malformed requests, prompt ACK and isolated listener failures.');
// The legacy Webhook client has no disconnect API; stop its HTTP server and
// refresh timer with the test process, as in non-channel.transport.mjs.
process.exit(0);
