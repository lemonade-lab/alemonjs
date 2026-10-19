import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import axios from 'axios';
import { logger } from 'alemonjs';
import { createAxiosInstance } from '../lib/sdk/instance.js';

const logs = [];
const original = logger.error;
logger.error = (...args) => logs.push(args);
const server = createServer((req, res) => {
  res.writeHead(401, { 'content-type': 'application/json', 'x-tps-trace-id': 'trace-123', 'set-cookie': 'session=secret-cookie' });
  res.end(JSON.stringify({ code: 11244, message: 'token rejected', access_token: 'response-secret' }));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const service = axios.create({ baseURL: `http://127.0.0.1:${server.address().port}` });
  await assert.rejects(
    createAxiosInstance(service, {
      method: 'post',
      url: '/app/getAppAccessToken?access_token=url-secret',
      headers: { Authorization: 'QQBot header-secret', Cookie: 'cookie-secret' },
      data: { appId: 'app', clientSecret: 'body-secret', file_data: 'large-base64-data' }
    }),
    error => error.code === 11244 && error.message === 'token rejected' && error.access_token === 'response-secret'
  );
  assert.deepEqual(logs.at(-1), [
    '[qq-bot] HTTP request failed',
    { method: 'POST', path: '/app/getAppAccessToken', status: 401, code: 11244, transportCode: 'ERR_BAD_REQUEST', traceId: 'trace-123' }
  ]);
  const native = new Error('network failure with secret');
  native.code = 'ECONNRESET';
  native.request = { socket: native, _header: 'Authorization: secret' };
  await assert.rejects(
    createAxiosInstance(async () => {
      throw native;
    }, {}),
    error => error === native
  );
  const payload = { err_code: 99, message: 'original' };
  await assert.rejects(
    createAxiosInstance(async () => {
      throw { response: { data: payload } };
    }, {}),
    error => error === payload
  );
  const serialized = JSON.stringify(logs);
  for (const secret of [
    'header-secret',
    'body-secret',
    'url-secret',
    'response-secret',
    'cookie-secret',
    'secret-cookie',
    'large-base64-data',
    'network failure with secret'
  ]) {
    assert(!serialized.includes(secret), `Logs must omit ${secret}`);
  }
  assert.equal(logs.at(-1)[1].code, 99);
  assert.deepEqual(await createAxiosInstance(async () => ({ data: { id: 'ok' } }), {}), { id: 'ok' });
  assert.deepEqual(await createAxiosInstance(async () => ({ status: 204 }), {}), {});
} finally {
  logger.error = original;
  await new Promise(resolve => server.close(resolve));
}
console.log('Verified real HTTP diagnostics, credential omission, native failure identity and empty success responses.');

process.exit(0);
