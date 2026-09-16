/* global Buffer, process, URL, Response, Headers, fetch, AbortController */
import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync, statSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  DouyinHttp,
  ImClient,
  message,
  contact,
  request,
  profile,
  protocol,
  createAccountManager,
  parseMessageContent,
  setSdkLogger,
  pollQrConfirm,
  getQrcode,
  mapProtoConversationListItem,
  runBrowserVerification
} from '@alemonjs/douyin/sdk';

const address = { conversationId: '90071992547409931', conversationShortId: '90071992547409933', conversationType: 2 };
const uid = '90071992547409935';
const messageId = '90071992547409937';
const root = await protocol.loadRoot();
const Request = root.lookupType('im.RequestEnvelope');
const ResponseEnvelope = root.lookupType('im.ResponseEnvelope');

function protoClient(reply) {
  const calls = [];
  const http = new DouyinHttp({
    initialCookies: 'sessionid=test-session',
    fetch: async (url, init) => {
      const decoded = Request.toObject(Request.decode(init.body), { longs: String, defaults: true });
      const call = { url: new URL(url), init, request: decoded };
      calls.push(call);
      const response = await reply(call);
      const bytes = ResponseEnvelope.encode(ResponseEnvelope.fromObject({ cmd: decoded.cmd, statusCode: 0, ...response })).finish();
      return new Response(bytes);
    }
  });
  const client = new ImClient({ http, userId: uid, cookies: http.getCookies(), deviceId: '3241234567' });
  return { client, http, calls };
}

test('text, mentions, reply and forward reach the binary IM transport with exact int64 IDs', async () => {
  const { client, calls } = protoClient(() => ({ body: { sendMessage: { serverMessageId: messageId, status: 0 } } }));
  const sent = await message.sendText(client, address, '@小明 你好', [{ uid, text: '@小明', location: 0, length: 3 }]);
  assert.equal(sent.serverMessageId, messageId);
  const { request: encoded, init, url } = calls[0];
  assert.equal(encoded.cmd, 100);
  assert.equal(url.pathname, '/v1/message/send');
  assert.equal(url.searchParams.get('device_id'), '3241234567');
  assert.equal(init.headers.get('x-ss-stub'), createHash('md5').update(init.body).digest('hex'));
  assert.match(init.headers.get('cookie'), /sessionid=test-session/);
  assert.equal(encoded.body.sendMessage.conversationShortId, address.conversationShortId);
  assert.deepEqual(encoded.body.sendMessage.mentionedUsers, [uid]);
  assert.equal(JSON.parse(encoded.body.sendMessage.content).richTextInfos[0].info.uid, uid);
  await message.reply(client, { ...address, text: '回复', referencedMessageId: messageId, referencedMessageType: 7, referencedUid: uid });
  assert.equal(calls[1].request.body.sendMessage.refMsgInfo.referencedMessageId, messageId);
  await message.sendForwardNodes(client, address, [{ uid, nickname: '小明', text: '原消息', msgId: messageId, msgType: 7, aweType: 700 }], uid);
  assert.equal(calls[2].request.body.sendMessage.messageType, 136);
  assert.equal(parseMessageContent(calls[2].request.body.sendMessage.content, 136).kind, 'forward');
});

test('send rejection is not reported as success', async () => {
  const { client } = protoClient(() => ({ body: { sendMessage: { status: 1, checkMessage: JSON.stringify({ status_code: 7523, tips: '限流' }) } } }));
  const result = await client.sendText(address, 'hello');
  assert.notEqual(result.statusCode, 0);
  assert.equal(result.checkCode, 7523);
  assert.equal(result.serverMessageId, undefined);
});

test('recall, reaction, group update and request reviews use the upstream command contracts', async () => {
  const { client, calls } = protoClient(() => ({}));
  await message.recall(client, address, messageId);
  await client.modifyReaction({ ...address, serverMessageId: messageId, operatorUid: uid, emoji: '赞', enabled: true });
  await client.modifyReaction({ ...address, serverMessageId: messageId, operatorUid: uid, emoji: '赞', enabled: false });
  await contact.setGroupName(client, address, '新群名');
  await request.approveFriend(client, uid);
  await request.rejectFriend(client, uid);
  await request.approveGroupJoin(client, messageId);
  await request.rejectGroupJoin(client, messageId);
  assert.deepEqual(
    calls.map(c => c.request.cmd),
    [702, 705, 705, 902, 2049, 2049, 2025, 2025]
  );
  assert.equal(calls[0].request.body.recallMessage.serverMessageId, messageId);
  const property = calls[1].request.body.modifyMessageProperty.propertyList[0];
  assert.equal(property.serverMessageId, messageId);
  assert.equal(property.modifyPropertyContent[0].operation, 0);
  assert.equal(calls[2].request.body.modifyMessageProperty.propertyList[0].modifyPropertyContent[0].operation, 1);
  assert.equal(calls[3].request.body.setConversationCoreInfo.name, '新群名');
  assert.equal(calls[4].request.body.replyFriendApply.userId[0], uid);
  assert.equal(calls[6].request.body.ackConversationApply.applyId, messageId);
});

test('history preserves IDs and transmits the requested page', async () => {
  const { client, calls } = protoClient(() => ({
    body: { conversationMessages: { messages: [{ serverMessageId: messageId, sender: uid, content: '{"text":"历史"}', messageType: 7 }] } }
  }));
  const history = await message.getHistory(client, address, { cursor: 42, count: 7 });
  assert.equal(calls[0].request.cmd, 301);
  assert.equal(calls[0].request.body.conversationMessages.anchorIndex, '42');
  assert.equal(calls[0].request.body.conversationMessages.limit, 7);
  assert.equal(history[0].msgId, messageId);
});

test('history resolves a message ID to an exact string cursor', async () => {
  const cursor = '90071992547409943';
  const { client, calls } = protoClient(() => ({
    body: {
      conversationMessages: { messages: [{ serverMessageId: messageId, sender: uid, indexInConversation: cursor, content: '{"text":"历史"}', messageType: 7 }] }
    }
  }));
  await message.getHistory(client, address, { messageId, count: 3 });
  assert.equal(calls[0].request.body.conversationMessages.limit, 60);
  assert.equal(calls[1].request.body.conversationMessages.anchorIndex, cursor);
  await assert.rejects(message.getHistory(client, address, { messageId: '1' }), /not found/);
  await assert.rejects(client.getChatHistory({ ...address, cursor: Number(cursor) }), /safe integer/);
});

test('group metadata supports both list and V2 conversation shapes', async () => {
  const { client } = protoClient(() => ({
    body: { conversationList: { conversations: [{ ...address, extInfo: { name: '测试群', avatar: 'https://example.com/group.png' } }] } }
  }));
  const groups = await contact.getGroupList(client);
  assert.equal(groups[0].name, '测试群');
  assert.equal(groups[0].avatar, 'https://example.com/group.png');
  assert.equal((await contact.resolveGroupAddress(client, '测试群')).conversationShortId, address.conversationShortId);
  const v2 = mapProtoConversationListItem({ ...address, conversationCoreInfo: { name: 'V2群', icon: 'https://example.com/v2.png' } });
  assert.equal(v2.name, 'V2群');
  assert.equal(v2.avatar, 'https://example.com/v2.png');
});

test('image, file and multipart video uploads complete STS, VOD and TOS before sending', async () => {
  const calls = [];
  const http = new DouyinHttp({
    initialCookies: 'sessionid=private',
    fetch: async (raw, init) => {
      const url = new URL(raw);
      calls.push({ url, init });
      if (url.pathname.includes('config/v2')) {
        const config = { access_key_id: 'test-key', secret_access_key: 'test-secret', session_token: 'test-token', space_name: 'test-space' };
        return Response.json({ public_image_config: config, public_file_config: config });
      }
      if (url.searchParams.get('Action') === 'ApplyUploadInner') {
        assert.equal(init.headers.has('cookie'), false);
        assert.match(init.headers.get('authorization'), /^AWS4-HMAC-SHA256 /);
        return Response.json({
          Result: {
            InnerUploadAddress: {
              UploadNodes: [
                { UploadHost: 'storage.example.com', SessionKey: 'upload-session', StoreInfos: [{ StoreUri: 'test-object', Auth: 'upload-auth' }] }
              ],
              AdvanceOption: { EncryptionKey: 'encryption-key' }
            },
            SDKParam: { server_gcm_encryption_mode: 'mode' }
          }
        });
      }
      if (url.searchParams.get('Action') === 'CommitUploadInner') {
        return Response.json({ Result: { Results: [{ Encryption: { Uri: 'uploaded-uri', SecretKey: 'media-key', SourceMd5: 'media-md5' } }] } });
      }
      if (url.host === 'storage.example.com') {
        assert.equal(init.headers.has('cookie'), false);
        if (url.searchParams.get('phase') === 'init') return Response.json({ code: 2000, data: { uploadid: 'multipart-id' } });
        return Response.json({ code: 2000 });
      }
      const decoded = Request.toObject(Request.decode(init.body), { longs: String });
      assert.equal(decoded.cmd, 100);
      return new Response(ResponseEnvelope.encode(ResponseEnvelope.fromObject({ body: { sendMessage: { serverMessageId: messageId } } })).finish());
    }
  });
  const client = new ImClient({ http, userId: uid, cookies: http.getCookies() });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCdwAAAAASUVORK5CYII=', 'base64');
  assert.equal((await message.sendImage(client, address, png)).serverMessageId, messageId);
  assert.equal((await message.sendFile(client, address, Buffer.from('hello'), 'hello.txt')).serverMessageId, messageId);
  assert.equal((await message.sendVideo(client, address, Buffer.alloc(5 * 1024 * 1024 + 1, 1), png, 640, 480)).serverMessageId, messageId);
  const parts = calls.filter(call => call.url.searchParams.get('phase') === 'transfer');
  assert.deepEqual(
    parts.map(call => call.init.body.length),
    [5 * 1024 * 1024, 1]
  );
  const committed = calls.filter(call => call.url.searchParams.get('Action') === 'CommitUploadInner');
  assert.equal(committed.length, 4);
  await assert.rejects(client.uploadFile(Buffer.alloc(10 * 1024 * 1024 + 1), 'large.bin'), /10 MiB/);
});

test('request pagination rejects a repeated cursor instead of looping', async () => {
  const { client, calls } = protoClient(() => ({ body: { getConversationAuditList: { hasMore: true, nextCursor: '10' } } }));
  await assert.rejects(client.getGroupJoinRequests(), /cursor did not advance/);
  assert.equal(calls.length, 2);
});

test('profiles include cached hits and batch missing IDs in groups of 50', async () => {
  const calls = [];
  const http = new DouyinHttp({
    fetch: async (_url, init) => {
      const ids = JSON.parse(init.body.get('sec_user_ids'));
      calls.push(ids);
      return Response.json({
        status_code: 0,
        data: ids.map(sec_uid => ({ sec_uid, nickname: sec_uid, avatar_thumb: { url_list: ['https://example.com/avatar'] } }))
      });
    }
  });
  const ids = Array.from({ length: 55 }, (_, i) => `MS4-${i}`);
  assert.equal((await profile.fetchUserProfiles(http, ids)).size, 55);
  assert.deepEqual(
    calls.map(batch => batch.length),
    [50, 5]
  );
  assert.equal((await profile.fetchUserProfiles(http, [ids[0], ids[54]])).size, 2);
  assert.equal(calls.length, 2);
});

test('HTTP handles Headers, cookies and errors without logging credentials', async () => {
  const logs = [];
  setSdkLogger({ debug: text => logs.push(text) });
  const calls = [];
  const http = new DouyinHttp({
    initialCookies: 'sessionid=old',
    fetch: async (url, init) => {
      calls.push({ url, init });
      return Response.json({ secret: 'response-secret' }, { headers: { 'set-cookie': 'sessionid=new; Path=/' } });
    }
  });
  try {
    await http.requestJson('https://imdesktop.douyin.com/test', { headers: new Headers({ 'X-Test': 'ok' }) });
    await http.requestJson('https://vod.bytedanceapi.com/test');
    assert.equal(calls[0].init.headers.get('X-Test'), 'ok');
    assert.match(http.getCookies(), /sessionid=new/);
    assert.equal(calls[1].init.headers.has('cookie'), false);
    assert.doesNotMatch(logs.join('\n'), /response-secret|sessionid/);
  } finally {
    setSdkLogger({});
  }
  const bad = new DouyinHttp({ fetch: async () => new Response('<html>challenge</html>', { headers: { 'x-vc-bdturing-parameters': 'challenge' } }) });
  await assert.rejects(
    bad.requestJson('https://imdesktop.douyin.com/test?secret=hidden'),
    error => error.kind === 'captcha' && !error.message.includes('hidden')
  );
});

test('QR login obtains a QR and preserves a confirmed string account ID', async () => {
  const http = new DouyinHttp({
    enableABogus: false,
    fetch: async url => {
      if (new URL(url).pathname.includes('get_qrcode')) {
        return Response.json({ data: { error_code: 0, token: 'qr-token', qrcode: 'base64-image', expire_time: 120 } });
      }
      return Response.json(
        { data: { error_code: 0, status: 'confirmed', user_data: { user_id_str: uid } } },
        { headers: { 'set-cookie': 'sessionid=confirmed; Path=/' } }
      );
    }
  });
  const qr = await getQrcode(http);
  assert.equal(qr.token, 'qr-token');
  const session = await pollQrConfirm(http, qr.token);
  assert.equal(session.platformUid, uid);
  assert.match(session.cookies, /sessionid=confirmed/);
});

test('browser verification serves its packaged assets on loopback and can be cancelled', async () => {
  let resolveUrl;
  const urlReady = new Promise(resolve => {
    resolveUrl = resolve;
  });
  const verified = runBrowserVerification(
    new DouyinHttp(),
    {
      raw: '{}',
      secondary: false,
      decision: { url: 'https://imdesktop.douyin.com/verify.js' }
    },
    { onUrl: resolveUrl, timeoutMs: 5000 }
  );
  // Attach rejection handling before interacting with the server.
  const closed = assert.rejects(verified, /关闭了登录验证/);
  const url = new URL(await Promise.race([urlReady, verified]));
  assert.equal(url.hostname, '127.0.0.1');
  const page = await fetch(url);
  assert.equal(page.status, 200);
  await page.text();
  url.pathname = '/react.js';
  const asset = await fetch(url);
  assert.match(await asset.text(), /React/);
  url.pathname = '/api/cancel';
  await (await fetch(url, { method: 'POST' })).text();
  await closed;
});

test('QR cancellation performs no polling and verification callback failures release the server', async () => {
  const controller = new AbortController();
  controller.abort();
  const http = new DouyinHttp({
    fetch: async () => {
      assert.fail('Aborted QR must not make HTTP requests');
    }
  });
  await assert.rejects(pollQrConfirm(http, 'token', { signal: controller.signal }), { name: 'AbortError' });
  await assert.rejects(
    runBrowserVerification(
      http,
      {
        raw: '{}',
        secondary: false,
        decision: { url: 'https://imdesktop.douyin.com/verify.js' }
      },
      {
        onUrl() {
          throw new Error('consumer stopped');
        },
        timeoutMs: 1000
      }
    ),
    /回调失败/
  );
});

test('account sessions restore independently and logout only removes the session', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'douyin-sdk-test-'));
  const manager = createAccountManager({ accountsDir: directory, warmupOnRestore: false });
  try {
    manager.importSession({ platformUid: uid, cookies: 'sessionid=one' }, { deviceId: '3241234567', installId: '90071992547409939', guid: 'test-guid' });
    const file = join(directory, uid, 'session.json');
    if (process.platform !== 'win32') assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).platformUid, uid);
    manager.stop();
    await manager.restore();
    assert.equal(manager.accounts.get(uid).http.deviceId, '3241234567');
    assert.equal(manager.accounts.get(uid).http.installId, '90071992547409939');
    assert.throws(() => manager.logout('../'), /decimal ID/);
    manager.logout(uid);
    assert.equal(manager.store.load(uid), undefined);
  } finally {
    manager.stop();
    rmSync(directory, { recursive: true, force: true });
  }
});

class Socket extends EventEmitter {
  readyState = 0;
  ping() {}
  open() {
    this.readyState = 1;
    this.emit('open');
  }
  close() {
    this.readyState = 3;
    this.emit('close', 1000, Buffer.alloc(0));
  }
  terminate() {
    this.close();
  }
}

test('WS rejected handshakes and cancellation settle; restart has one connection', async () => {
  const sockets = [];
  const ws = new protocol.AndroidFrontierWs({
    userId: uid,
    cookies: '',
    webSocketFactory: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket;
    }
  });
  const rejected = ws.connect();
  sockets[0].emit('unexpected-response', {}, { statusCode: 403, headers: {}, resume() {} });
  await assert.rejects(rejected, /403/);
  const cancelled = ws.connect();
  ws.close();
  await assert.rejects(cancelled, /stopped/);
  const ready = ws.connect();
  assert.equal(ws.connect(), ready);
  sockets[2].open();
  await ready;
  assert.equal(ws.connected, true);
  ws.close();
  assert.equal(ws.connected, false);
});

test('high-numbered group join requests reach request listeners', async () => {
  let socket;
  const http = new DouyinHttp();
  const client = new ImClient({ http, userId: uid, cookies: '', webSocketFactory: () => (socket = new Socket()) });
  const events = [];
  client.on('request', event => events.push(event));
  const ready = client.start();
  socket.open();
  await ready;
  try {
    const { fieldStringValue: str, fieldVarint: num } = protocol;
    socket.emit(
      'message',
      Buffer.concat([
        str(1, address.conversationId),
        num(3, BigInt(messageId)),
        num(5, BigInt(address.conversationShortId)),
        num(6, 90001n),
        num(7, 90071992547409941n),
        str(8, JSON.stringify({ apply_info: { apply_id: messageId, conv_short_id: address.conversationShortId } }))
      ])
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'group.join-request');
    assert.equal(events[0].requestId, messageId);
  } finally {
    client.stop();
  }
});
