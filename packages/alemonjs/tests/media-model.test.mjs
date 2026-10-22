import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { createTestApp } from 'alemonjs/testing';
import { Format, Media, useMedia, useMessage, ResultCode, shutdownLogger } from 'alemonjs';
after(() => shutdownLogger());
const resource = {
  kind: 'media-resource',
  type: 'image',
  id: 'image-1',
  reference: 'qqbot-media://image/v1/token',
  owner: { platform: 'qq-bot', botId: 'bot' },
  usage: 'markdown',
  expiration: { mode: 'sliding', windowSeconds: 7776000 }
};
const ok = data => [{ code: ResultCode.Ok, message: 'OK', data }];
const setup = t => {
  const app = createTestApp();
  t.after(() => app.dispose());
  return app;
};
const event = app => app.events.groupMessage({ platform: 'qq-bot', botId: 'bot', groupId: 'g' });

test('image factory is pure, validates one source and preserves legacy nodes', t => {
  const app = setup(t);
  const image = Media.image({ filePath: '/tmp/chart.png' });
  const md = Format.createMarkdown().addImage(image);
  const native = Format.create().addImage(image);
  assert.equal(app.calls.length, 0);
  assert.equal(md.value.value[0].media.kind, 'media-source');
  assert.equal(native.value[0].media.source.filePath, '/tmp/chart.png');
  assert.equal(Format.create().addImage(Buffer.from('x')).value[0].value, 'base64://eA==');
  assert.equal(Format.createMarkdown().addImage('https://example.com/x.png').value.value[0].value, 'https://example.com/x.png');
  assert.throws(() => Media.image({ filePath: 'a', url: 'b' }), /exactly one/);
});

test('ordinary image sources use existing adapters without a resource upload action', async t => {
  const app = setup(t);
  const result = await app.runHandler(async e => {
    await useMessage(e)[0].send(Format.create().addImage(Media.image({ filePath: '/tmp/x.png' })).value);
  }, event(app));
  assert.deepEqual(
    result.actions.map(row => row.name),
    ['message.send']
  );
  assert.equal(result.messages[0].nodes[0].value, 'file:///tmp/x.png');
  assert.equal(result.messages[0].nodes[0].media, undefined);
});

test('nested Markdown resolves resources before delivery and does not mutate reusable sources', async t => {
  const app = setup(t);
  app.actions.on('media.resource.resolve', request => {
    assert.equal(request.payload.params.usage, 'markdown');
    assert.equal(request.payload.BotId, 'bot');
    return ok(resource);
  });
  const image = Media.image({ data: 'eA==' });
  const format = Format.create().addMarkdown(Format.createMarkdown().addBlockquote(Format.createMarkdown().addImage(image)));
  const result = await app.runHandler(async e => useMessage(e)[0].send({ format }), event(app));
  assert.deepEqual(
    result.actions.map(row => row.name),
    ['media.resource.resolve', 'message.send']
  );
  assert.equal(result.messages[0].nodes[0].value[0].value[0].value, resource.reference);
  assert.equal(format.value[0].value[0].value[0].media.kind, 'media-source');
  assert.equal(result.value[0].media.stage, 'send');
  assert.equal(result.value[0].media.resources[0].id, resource.id);
});

test('ownership and usage are checked across the entire message before any upload', async t => {
  const app = setup(t);
  const format = Format.create().addMarkdown(
    Format.createMarkdown()
      .addImage(Media.image({ data: 'eA==' }))
      .addImage({ ...resource, owner: { platform: 'qq-bot', botId: 'other' } })
  );
  const result = await app.runHandler(async e => useMessage(e)[0].send({ format }), event(app));
  assert.equal(result.actions.length, 0);
  assert.equal(result.value[0].media.stage, 'prepare');
  assert.equal(result.value[0].code, ResultCode.Fail);
  const mismatch = await app.runHandler(async e => useMessage(e)[0].send(Format.create().addImage(resource).value), event(app));
  assert.equal(mismatch.messages.length, 0);
  assert.match(mismatch.value[0].message, /different usage/);
});

test('unsupported resolution prevents message delivery rather than silently degrading the image', async t => {
  const app = setup(t);
  app.actions.on('media.resource.resolve', () => [{ code: ResultCode.Warn, message: 'Unsupported', data: null }]);
  const result = await app.runHandler(
    async e => useMessage(e)[0].send(Format.create().addMarkdown(Format.createMarkdown().addImage(Media.image({ url: 'https://example.com/x.png' }))).value),
    event(app)
  );
  assert.equal(result.messages.length, 0);
  assert.equal(result.value[0].media.stage, 'prepare');
});

test('successful resources survive both delivery failures and partial preparation failures', async t => {
  const app = setup(t);
  let calls = 0;
  app.actions.on('media.resource.resolve', () => (++calls === 1 ? ok(resource) : [{ code: ResultCode.Fail, message: 'quota', data: { code: 40035007 } }]));
  const md = Format.createMarkdown()
    .addImage(Media.image({ data: 'eA==' }))
    .addImage(Media.image({ data: 'eQ==' }));
  const partial = await app.runHandler(async e => useMessage(e)[0].send(Format.create().addMarkdown(md).value), event(app));
  assert.equal(partial.messages.length, 0);
  assert.equal(partial.value[0].media.resources[0].id, resource.id);
  app.actions.on('media.resource.resolve', () => ok(resource));
  app.actions.on('message.send', () => [{ code: ResultCode.Fail, message: 'delivery failed', data: null }]);
  const failed = await app.runHandler(
    async e => useMessage(e)[0].send(Format.create().addMarkdown(Format.createMarkdown().addImage(resource)).value),
    event(app)
  );
  assert.equal(failed.value[0].media.stage, 'send');
  assert.equal(failed.value[0].media.resources[0].id, resource.id);
});

test('resource hooks preserve legacy uploads and expose bot-scoped management actions', async t => {
  const app = setup(t);
  app.actions.on('media.resource.upload', () => ok(resource));
  app.actions.on('media.upload', () => ok({ fileId: 'legacy' }));
  app.actions.on('media.resource.list', () => ok({ Items: [resource] }));
  app.actions.on('media.resource.delete', () => ok({}));
  app.actions.on('media.resource.capabilities', () => ok({ usages: { markdown: { upload: true, list: true, delete: true } } }));
  const result = await app.runHandler(async () => {
    const [media] = useMedia({ Platform: 'qq-bot', BotId: 'bot' });
    assert.equal((await media.upload({ type: 'image', data: 'eA==' })).data.fileId, 'legacy');
    assert.equal((await media.upload({ type: 'image', data: 'eA==', usage: 'markdown' })).data.id, resource.id);
    assert.equal((await media.list({ usage: 'markdown' })).data.Items.length, 1);
    await media.delete(resource);
    await media.capabilities();
  }, event(app));
  assert.deepEqual(
    result.actions.map(row => row.name),
    ['media.upload', 'media.resource.upload', 'media.resource.list', 'media.resource.delete', 'media.resource.capabilities']
  );
});

test('legacy string blockquotes pass through without becoming character arrays', async t => {
  const app = setup(t);
  const nodes = [{ type: 'Markdown', value: [{ type: 'MD.blockquote', value: 'legacy quote' }] }];
  const result = await app.runHandler(async e => useMessage(e)[0].send(nodes), event(app));
  assert.equal(result.messages[0].nodes[0].value[0].value, 'legacy quote');
});

test('structured image preparation snapshots nodes before asynchronous work', async t => {
  const app = setup(t);
  app.actions.on('media.resource.resolve', request => {
    assert.equal(request.payload.params.image.source.data, 'eA==');
    return ok(resource);
  });
  const source = Media.image({ data: 'eA==' });
  const md = Format.createMarkdown().addImage(source);
  const format = Format.create().addMarkdown(md);
  const result = await app.runHandler(() => {
    void useMessage()[0].send(format.value);
    format.addText('later');
    source.source.data = 'eQ==';
  }, event(app));
  assert.equal(result.messages[0].nodes.length, 1);
});
