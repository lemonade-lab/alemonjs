import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { createHmac, createHash } from 'node:crypto';
import { createDriver as whatsappDriver } from '../../packages/whatsapp/src/driver.ts';
import { createDriver as messengerDriver } from '../../packages/messenger/src/driver.ts';
import { createDriver as instagramDriver } from '../../packages/instagram/src/driver.ts';
import { createDriver as lineDriver } from '../../packages/line/src/driver.ts';
import { createDriver as officialDriver } from '../../packages/wechat-official/src/driver.ts';
import { createDriver as kfDriver } from '../../packages/wechat-kf/src/driver.ts';
import WXBizMsgCrypt from 'wechat-crypto';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function callback() {
  const s = createServer();
  s.listen(0, '127.0.0.1');
  await once(s, 'listening');
  const port = s.address().port;
  await new Promise(r => s.close(r));
  return { host: '127.0.0.1', port, path: '/events' };
}
const ctx = config => ({ platform: 'test', config, emit: e => ctx.events.push(e), ready() {}, state() {} });
ctx.events = [];

for (const kind of ['whatsapp', 'messenger', 'instagram'])
  test(`${kind}: signed webhook and account routing`, async t => {
    const cb = await callback();
    const events = [];
    const context = {
      ...ctx({
        access_token: 'test',
        app_secret: 'secret',
        verify_token: 'verify',
        api_version: 'v25.0',
        phone_number_id: 'phone',
        account_id: 'account',
        callback: cb
      }),
      emit: e => events.push(e)
    };
    const d = ({ whatsapp: whatsappDriver, messenger: messengerDriver, instagram: instagramDriver })[kind](context);
    await d.start();
    t.after(d.stop);
    const url = `http://127.0.0.1:${cb.port}/events`;
    assert.equal((await fetch(url + '?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=challenge')).status, 200);
    assert.equal(await (await fetch(url + '?hub.mode=subscribe&hub.verify_token=verify&hub.challenge=challenge')).text(), 'challenge');
    assert.equal((await fetch(url + '?hub.mode=subscribe&hub.verify_token=bad')).status, 403);
    const entry =
      kind === 'whatsapp'
        ? {
            changes: [
              {
                value: { metadata: { phone_number_id: 'phone' }, messages: [{ id: 'm', from: 'u', type: 'text', text: { body: 'hello' } }] }
              }
            ]
          }
        : { id: 'account', messaging: [{ sender: { id: 'u' }, message: { mid: 'm', text: 'hello' } }] };
    const raw = JSON.stringify({ entry: [entry] });
    assert.equal((await fetch(url, { method: 'POST', body: raw })).status, 401);
    assert.equal(events.length, 0);
    const signature = 'sha256=' + createHmac('sha256', 'secret').update(raw).digest('hex');
    assert.equal((await fetch(url, { method: 'POST', body: raw, headers: { 'x-hub-signature-256': signature } })).status, 200);
    assert.equal(events[0].user, 'u');
    assert.equal(events[0].text, 'hello');
    const foreign =
      kind === 'whatsapp'
        ? {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: 'other' },
                  messages: [{ id: 'other', from: 'u', type: 'text', text: { body: 'wrong account' } }]
                }
              }
            ]
          }
        : { id: 'other', messaging: [{ sender: { id: 'u' }, message: { mid: 'other', text: 'wrong account' } }] };
    const wrong = JSON.stringify({ entry: [foreign] });
    await fetch(url, {
      method: 'POST',
      body: wrong,
      headers: { 'x-hub-signature-256': 'sha256=' + createHmac('sha256', 'secret').update(wrong).digest('hex') }
    });
    assert.equal(events.length, 1);
    assert.equal(d.actions['message.send.channel'], undefined);
  });

test('LINE accepts only authentic callbacks, maps postbacks and private media', async t => {
  const cb = await callback();
  const events = [];
  const sent = [];
  const SDK = await import('@line/bot-sdk');
  class Client {
    async getBotInfo() {
      return { userId: 'bot' };
    }
    async replyMessage(p) {
      sent.push(p);
      return { sentMessages: [{ id: 'reply' }] };
    }
  }
  const d = lineDriver(
    { ...ctx({ channel_access_token: 'token', channel_secret: 'secret', callback: cb }), emit: e => events.push(e) },
    { ...SDK, messagingApi: { MessagingApiClient: Client } }
  );
  await d.start();
  t.after(d.stop);
  const raw = JSON.stringify({
    events: [
      {
        type: 'message',
        webhookEventId: 'event',
        source: { type: 'user', userId: 'u' },
        replyToken: 'reply',
        message: { id: 'm', type: 'image' }
      },
      { type: 'postback', webhookEventId: 'click', source: { type: 'user', userId: 'u' }, postback: { data: 'click' } }
    ]
  });
  const url = `http://127.0.0.1:${cb.port}/events`;
  assert.equal((await fetch(url, { method: 'POST', body: raw })).status, 401);
  const signature = createHmac('sha256', 'secret').update(raw).digest('base64');
  assert.equal((await fetch(url, { method: 'POST', body: raw, headers: { 'x-line-signature': signature } })).status, 200);
  assert.equal(events[0].media[0].FileId, 'm');
  assert.equal(events[1].interaction.data, 'click');
  assert.equal(
    (
      await d.actions['message.send']({
        event: { IsPrivate: true, UserId: 'u', value: { replyToken: 'reply' } },
        params: { format: [{ type: 'Text', value: 'response' }] }
      })
    ).id,
    'reply'
  );
  assert.equal(sent[0].replyToken, 'reply');
});

test('WeChat official verifies plaintext handshake and XML callback', async t => {
  const cb = await callback();
  const events = [];
  const d = officialDriver({ ...ctx({ app_id: 'app', app_secret: 'secret', token: 'token', callback: cb }), emit: e => events.push(e) });
  await d.start();
  t.after(d.stop);
  const signature = createHash('sha1').update(['token', '123', 'nonce'].sort().join('')).digest('hex');
  const url = `http://127.0.0.1:${cb.port}/events?timestamp=123&nonce=nonce&signature=${signature}`;
  assert.equal(await (await fetch(url + '&echostr=hello')).text(), 'hello');
  const raw =
    '<xml><ToUserName>app</ToUserName><FromUserName>u</FromUserName><CreateTime>123</CreateTime><MsgType>text</MsgType><Content>hello</Content><MsgId>9007199254740993</MsgId></xml>';
  assert.equal((await fetch(url, { method: 'POST', body: raw })).status, 200);
  assert.equal(events[0].id, '9007199254740993');
  assert.equal(events[0].text, 'hello');
});

test('WeChat KF verifies encrypted handshake including receiver identity', async t => {
  const cb = await callback();
  const key = Buffer.alloc(32, 1).toString('base64').slice(0, 43);
  const d = kfDriver(ctx({ corp_id: 'corp', secret: 'secret', token: 'token', encoding_aes_key: key, callback: cb }));
  await d.start();
  t.after(d.stop);
  const crypto = new WXBizMsgCrypt('token', key, 'corp');
  const encrypted = crypto.encrypt('challenge');
  const query = new URLSearchParams({
    timestamp: '123',
    nonce: 'nonce',
    echostr: encrypted,
    msg_signature: crypto.getSignature('123', 'nonce', encrypted)
  });
  const url = `http://127.0.0.1:${cb.port}/events?${query}`;
  assert.equal(await (await fetch(url)).text(), 'challenge');
  query.set('msg_signature', 'bad');
  assert.equal((await fetch(`http://127.0.0.1:${cb.port}/events?${query}`)).status, 401);
  const other = new WXBizMsgCrypt('token', key, 'other').encrypt('challenge');
  query.set('echostr', other);
  query.set('msg_signature', crypto.getSignature('123', 'nonce', other));
  assert.equal((await fetch(`http://127.0.0.1:${cb.port}/events?${query}`)).status, 401);
});

test('WeChat official AES mode rejects a different AppID even with a valid signature', async t => {
  const cb = await callback();
  const key = Buffer.alloc(32, 2).toString('base64').slice(0, 43);
  const d = officialDriver(ctx({ app_id: 'app', app_secret: 'secret', token: 'token', encoding_aes_key: key, callback: cb }));
  await d.start();
  t.after(d.stop);
  const crypto = new WXBizMsgCrypt('token', key, 'app');
  const other = new WXBizMsgCrypt('token', key, 'other');
  const query = encrypted =>
    new URLSearchParams({
      encrypt_type: 'aes',
      timestamp: '123',
      nonce: 'nonce',
      echostr: encrypted,
      msg_signature: crypto.getSignature('123', 'nonce', encrypted)
    });
  const base = `http://127.0.0.1:${cb.port}/events?`;
  assert.equal(await (await fetch(base + query(crypto.encrypt('challenge')))).text(), 'challenge');
  assert.equal((await fetch(base + query(other.encrypt('challenge')))).status, 401);
});

test('Meta local media upload uses multipart and returned media ID before send', async t => {
  const previous = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), ...options });
    const result = String(url).endsWith('/media') ? { id: 'media-id' } : { messages: [{ id: 'message-id' }] };
    return new Response(JSON.stringify(result), { status: 200 });
  };
  t.after(() => {
    globalThis.fetch = previous;
  });
  const d = whatsappDriver(
    ctx({ access_token: 'token', app_secret: 'secret', verify_token: 'verify', api_version: 'v25.0', phone_number_id: 'phone' })
  );
  const r = await d.actions['message.send.user']({
    UserId: '123',
    params: { format: [{ type: 'Attachment', value: 'base64://aGVsbG8=', options: { filename: 'hello.txt' } }] }
  });
  assert.equal(r.id, 'message-id');
  assert.equal(calls[0].body instanceof FormData, true);
  const sent = JSON.parse(calls[1].body);
  assert.equal(sent.document.id, 'media-id');
  assert.equal(sent.to, '123');
});

test('WeChat KF resumes durable notifications and advances its saved cursor', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'alemon-kf-test-'));
  const statePath = join(directory, 'state.json');
  await writeFile(
    statePath,
    JSON.stringify({ cursors: { kf: 'resume-cursor' }, pending: [{ openKfid: 'kf', syncToken: 'notification' }] })
  );
  const previous = globalThis.fetch;
  const calls = [];
  const events = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), ...options });
    return new Response(
      JSON.stringify(
        String(url).includes('/gettoken?')
          ? { errcode: 0, access_token: 'access', expires_in: 7200 }
          : {
              errcode: 0,
              next_cursor: 'next-cursor',
              has_more: 0,
              msg_list: [
                { origin: 3, msgid: 'm', msgtype: 'text', external_userid: 'customer', open_kfid: 'kf', text: { content: 'hello' } }
              ]
            }
      )
    );
  };
  t.after(async () => {
    globalThis.fetch = previous;
    await rm(directory, { recursive: true, force: true });
  });
  const cb = await callback();
  const key = Buffer.alloc(32, 1).toString('base64').slice(0, 43);
  const d = kfDriver({
    ...ctx({ corp_id: 'corp', secret: 'secret', token: 'token', encoding_aes_key: key, state_path: statePath, callback: cb }),
    emit: e => events.push(e)
  });
  await d.start();
  await d.client.idle();
  await d.stop();
  assert.equal(JSON.parse(calls[1].body).cursor, 'resume-cursor');
  assert.equal(events[0].text, 'hello');
  const stored = JSON.parse(await readFile(statePath, 'utf8'));
  assert.equal(stored.cursors.kf, 'next-cursor');
  assert.deepEqual(stored.pending, []);
});
