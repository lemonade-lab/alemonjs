import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDriver as feishu } from '../../packages/feishu/src/driver.ts';
import { createDriver as matrix } from '../../packages/matrix/src/driver.ts';

const platforms = JSON.parse(await readFile(new URL('../../scripts/social-platforms.json', import.meta.url), 'utf8'));

for (const name of platforms) {
  test(`${name}: structured messages retain text and reject unmapped fields`, async () => {
    const { sendActions } = await import(`../../packages/${name}/src/utils.ts`);
    let received;
    const actions = sendActions((_target, format) => { received = format; });
    actions['message.send.user']({ UserId: 'u', params: { content: { text: 'hello', markdown: { content: '**world**' } } } });
    assert.deepEqual(received, [{ type: 'Text', value: 'hello' }, { type: 'MarkdownOriginal', value: '**world**' }]);
    for (const content of [{ card: {} }, { keyboard: {} }, { media: { fileId: 'file' } }, { markdown: { templateId: 'template' } }]) {
      assert.throws(() => actions['message.send.user']({ UserId: 'u', params: { content } }), /native API|native API or format encoder/);
    }
    assert.throws(() => actions['message.send.user']({ UserId: 'u', params: { content: { text: 'x' }, format: [] } }), /not both/);
  });
}

test('Feishu reaction removal finds only the current app across pages', async () => {
  const pages = [];
  const deleted = [];
  const client = {
    im: { messageReaction: {
      list: async ({ params }) => {
        pages.push(params.page_token);
        return { code: 0, data: params.page_token ? {
          items: [{ reaction_id: 'own', operator: { operator_type: 'app', operator_id: 'app' }, reaction_type: { emoji_type: 'OK' } }], has_more: false
        } : {
          items: [{ reaction_id: 'other', operator: { operator_type: 'app', operator_id: 'other' }, reaction_type: { emoji_type: 'OK' } }],
          has_more: true, page_token: 'next'
        } };
      },
      delete: async ({ path }) => { deleted.push(path); return { code: 0, data: { reaction_id: path.reaction_id } }; }
    } }
  };
  class Client { constructor() { return client; } }
  class WSClient {}
  class EventDispatcher { register() { return this; } }
  const driver = feishu({ config: { app_id: 'app', app_secret: 'secret' } }, { Client, WSClient, EventDispatcher, Domain: {} });
  await driver.actions['reaction.remove']({ MessageId: 'm', EmojiId: 'OK' });
  assert.deepEqual(pages, [undefined, 'next']);
  assert.deepEqual(deleted, [{ message_id: 'm', reaction_id: 'own' }]);
  client.im.messageReaction.list = async () => ({ code: 0, data: { items: [], has_more: true, page_token: 'same' } });
  await assert.rejects(driver.actions['reaction.remove']({ MessageId: 'm', EmojiId: 'OK' }), /did not advance/);
});

test('Matrix message.get accepts the actual useMessage.get payload', async () => {
  const calls = [];
  const client = { on() {}, fetchRoomEvent: (...args) => { calls.push(args); return { event_id: args[1] }; } };
  const driver = matrix({ config: { base_url: 'https://example.com', access_token: 't', user_id: '@bot:example.com' } }, { createClient: () => client });
  await driver.actions['message.get']({ MessageId: 'm', event: { ChannelId: '!room:example.com' } });
  assert.deepEqual(calls[0], ['!room:example.com', 'm']);
});

test('Feishu upload returns a reusable key and prepared send does not upload again', async () => {
  let uploads = 0;
  const sent = [];
  const client = { im: {
    image: { create: async ({ data }) => { uploads++; assert.equal(data.image.toString(), 'hello'); return { code: 0, data: { image_key: 'image-key' } }; } },
    message: { create: async payload => { sent.push(payload); return { code: 0, data: { message_id: 'message' } }; } }
  } };
  class Client { constructor() { return client; } }
  class WSClient {}
  class EventDispatcher { register() { return this; } }
  const driver = feishu({ config: { app_id: 'app', app_secret: 'secret' } }, { Client, WSClient, EventDispatcher, Domain: {} });
  const receipt = await driver.actions['media.upload']({ params: { type: 'image', data: 'aGVsbG8=' } });
  assert.equal(receipt.fileId, 'image-key');
  await driver.actions['media.send.user']({ UserId: 'open-id', params: { type: 'image', fileId: receipt.fileId } });
  assert.equal(uploads, 1);
  assert.equal(sent[0].params.receive_id_type, 'open_id');
  assert.deepEqual(JSON.parse(sent[0].data.content), { image_key: 'image-key' });
});

for (const [name, types] of [['google-chat', ['image']], ['line', ['image']], ['wechat-official', ['image', 'audio']]]) {
  test(`${name}: media wrappers advertise supported content without file actions`, async () => {
    const { withMedia } = await import(`../../packages/${name}/src/utils.ts`);
    const actions = withMedia({ 'message.send.user': () => ({ accepted: true }) }, types);
    assert.equal(actions['file.send.user'], undefined);
    assert.throws(() => actions['media.send.user']({ UserId: 'u', params: { type: 'video', url: 'https://example.com/video.mp4' } }), /Invalid media type/);
  });
}
