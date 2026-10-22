import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import axios from 'axios';
import { createTestApp } from 'alemonjs/testing';
import { Format, Media, useMedia, useMessage, ResultCode, getConfig, shutdownLogger } from 'alemonjs';
import { QQBotAPI } from '../lib/sdk/api.js';
import { register } from '../lib/register.js';
import { QQImageMaterials } from '../lib/materials.js';

const directory = mkdtempSync(join(tmpdir(), 'qq-materials-'));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXa8AAAAASUVORK5CYII=', 'base64');
const path = join(directory, 'chart.png');
writeFileSync(path, png);
const md5 = createHash('md5').update(png).digest('hex');
const records = [];
const images = new Map();
let count = 0;
let mode = '';
let origin;
const server = createServer(async (req, res) => {
  res.setHeader('Connection', 'close');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bytes = Buffer.concat(chunks);
  const url = new URL(req.url, 'http://localhost');
  const body = req.method === 'PUT' ? bytes : bytes.length ? JSON.parse(bytes.toString()) : undefined;
  records.push({ method: req.method, path: url.pathname, body, headers: req.headers, cursor: url.searchParams.get('cursor') });
  const json = (data, status = 200) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === '/source.png') {
    assert.equal(req.headers.authorization, undefined);
    res.writeHead(200, { 'content-type': 'image/png' });
    return res.end(png);
  }
  if (url.pathname === '/v2/media-images/prepare') {
    if (mode === 'quota') return json({ code: 40035007, message: 'quota full' }, 400);
    assert.equal(body.file_size, png.length);
    assert.equal(body.md5, md5);
    assert.equal(body.sha1, createHash('sha1').update(png).digest('hex'));
    return json({ upload_id: `upload-${++count}`, presigned_url: `${origin}/binary`, expires_in: 3600 });
  }
  if (url.pathname === '/binary') {
    assert.deepEqual(bytes, png);
    assert.equal(req.headers['content-type'], 'image/png');
    assert.equal(req.headers.authorization, undefined, 'API credentials must not reach the signed upload URL');
    if (mode === 'put-fail') {
      res.writeHead(503);
      return res.end();
    }
    res.writeHead(200, { etag: `"${mode === 'bad-etag' ? '0'.repeat(32) : md5}"` });
    return res.end();
  }
  if (url.pathname === '/v2/media-images/complete') {
    assert.equal(body.md5, md5);
    if (mode === 'complete-fail') return json({ code: 40035006, message: 'completion failed' }, 500);
    const item = { image_id: `image-${count}`, url: `qqbot-media://image/v1/token-${count}`, ttl: 7776000, preview_url: 'https://temporary.invalid/private' };
    images.set(item.image_id, item);
    return json(item);
  }
  if (url.pathname === '/v2/media-images') return json({ images: [...images.values()], next_cursor: '', total: images.size });
  if (req.method === 'DELETE') {
    images.delete(url.pathname.split('/')[3]);
    return json({});
  }
  if (url.pathname === '/v2/groups/g/files') return json({ file_info: 'native-file', ttl: 3600, file_uuid: 'uuid' });
  if (url.pathname === '/v2/groups/g/messages') {
    if (mode === 'send-fail') return json({ code: 999, message: 'sending failed' }, 500);
    return json({ id: 'message', timestamp: '1' });
  }
  json({ error: url.pathname }, 404);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
origin = `http://127.0.0.1:${server.address().port}`;
const client = new QQBotAPI({ app_id: 'app' });
client.on = () => client;
client.groupService = options =>
  axios({ baseURL: origin, ...options, headers: { Authorization: 'QQBot TEST_ONLY' } })
    .then(r => r.data)
    .catch(error => {
      throw error.response?.data ?? error;
    });
const app = createTestApp({ config: { 'qq-bot': { app_id: 'app' } } });
const adapter = await app.runHandler(() => register(client, { botId: 'app', cbp: { send() {}, onactions() {}, onapis() {} } }), app.events.groupMessage());
for (const action of [
  'media.resource.upload',
  'media.resource.resolve',
  'media.resource.list',
  'media.resource.delete',
  'media.resource.capabilities',
  'message.send'
]) {
  app.actions.on(
    action,
    request =>
      new Promise(resolve => {
        void adapter.value.onAction(request, resolve);
      })
  );
}
const event = () => app.events.groupMessage({ platform: 'qq-bot', botId: 'app', groupId: 'g' });
const format = image => Format.create().addMarkdown(Format.createMarkdown().addBlockquote(Format.createMarkdown().addText('report').addImage(image))).value;
try {
  const first = await app.runHandler(async e => useMessage(e)[0].send(format(Media.image({ filePath: path }))), event());
  assert.equal(first.value[0].code, ResultCode.Ok);
  const resource = first.value[0].media.resources[0];
  assert.equal(resource.usage, 'markdown');
  assert.equal(resource.owner.botId, 'app');
  assert.equal(resource.expiration.mode, 'sliding');
  assert.equal(resource.expiration.expiresAt, undefined, 'Do not invent a fixed expiry for a sliding resource');
  assert(!JSON.stringify(resource).includes('temporary.invalid'));
  assert(records.some(row => row.path.endsWith('/messages') && row.body.markdown.content.includes(resource.reference)));
  const prepared = records.filter(row => row.path.endsWith('/prepare')).length;
  mode = 'send-fail';
  const failed = await app.runHandler(async e => useMessage(e)[0].send(format(Media.image({ filePath: path }))), event());
  assert.equal(failed.value[0].code, ResultCode.Fail);
  assert.equal(failed.value[0].media.stage, 'send');
  assert.equal(records.filter(row => row.path.endsWith('/prepare')).length, prepared);
  mode = '';
  const retry = await app.runHandler(async e => useMessage(e)[0].send(format(failed.value[0].media.resources[0])), event());
  assert.equal(retry.value[0].code, ResultCode.Ok);
  assert.equal(records.filter(row => row.path.endsWith('/prepare')).length, prepared);
  const managed = await app.runHandler(async () => {
    const [media] = useMedia({ Platform: 'qq-bot', BotId: 'app' });
    assert.equal((await media.capabilities()).data.usages.markdown.maxItems, 100);
    assert.equal((await media.list({ usage: 'markdown', cursor: 'next' })).data.Items[0].id, resource.id);
    await media.delete(resource);
  }, event());
  assert(!managed.errors.length);
  assert(records.some(row => row.cursor === 'next'));
  assert.equal(images.size, 0);
  await app.runHandler(async e => useMessage(e)[0].send(format(Media.image({ filePath: path }))), event());
  assert.equal(records.filter(row => row.path.endsWith('/prepare')).length, prepared + 1, 'Deleting invalidates local reuse');
  const before = records.length;
  const foreign = await app.runHandler(async e => useMessage(e)[0].send(format({ ...resource, owner: { platform: 'qq-bot', botId: 'other' } })), event());
  assert.equal(foreign.value[0].media.stage, 'prepare');
  assert.equal(records.length, before);
  const native = await app.runHandler(async e => {
    const uploaded = await useMedia(e)[0].upload({ type: 'image', filePath: path, usage: 'message' });
    return useMessage(e)[0].send(Format.create().addImage(uploaded.data).value);
  }, event());
  assert.equal(native.value[0].code, ResultCode.Ok);
  assert(records.some(row => row.path.endsWith('/messages') && row.body.media?.file_info === 'native-file'));
  const materials = new QQImageMaterials(client, 'app');
  await materials.upload({ url: `${origin}/source.png`, name: 'url.png' });
  await assert.rejects(materials.upload({ data: Buffer.from('not an image').toString('base64') }), /support/);
  await assert.rejects(materials.upload({ data: png.toString('base64'), name: 'wrong.jpg' }), /extension/);
  for (const failure of ['bad-etag', 'put-fail', 'complete-fail', 'quota']) {
    mode = failure;
    await assert.rejects(materials.upload({ data: png.toString('base64'), name: `${failure}.png` }));
  }
  mode = '';
  const previous = count;
  const concurrent = await Promise.all([
    materials.upload({ data: png.toString('base64'), name: 'concurrent.png' }),
    materials.upload({ data: png.toString('base64'), name: 'concurrent.png' })
  ]);
  assert.equal(concurrent[0].id, concurrent[1].id);
  assert.equal(count, previous + 1);
  console.log(
    'Verified real HTTP Markdown materials, MIME/hash/ETag, token isolation, nested delivery, resource retry, cache/delete, quota failures and native image resources.'
  );
} finally {
  await app.dispose();
  await new Promise(resolve => server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
  await shutdownLogger();
}
