/* global Buffer, process */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test, { after } from 'node:test';
import { ResultCode, shutdownLogger, getConfig } from 'alemonjs/common';
import { DouyinAdapter } from '../lib/adapter.js';
import { buildDesktopTextContent } from '../lib/sdk/index.js';
import { loadMedia } from '../lib/media.js';
import { startDirectAdapter } from '../lib/runtime.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testDirectory = mkdtempSync(join(tmpdir(), 'douyin-adapter-test-'));
const previousConfigPath = process.env.CFG_PATH;
process.env.CFG_PATH = join(testDirectory, 'alemon.config.yaml');

after(async () => {
  getConfig().dispose();
  if (previousConfigPath === undefined) {
    delete process.env.CFG_PATH;
  } else {
    process.env.CFG_PATH = previousConfigPath;
  }
  rmSync(testDirectory, { recursive: true, force: true });
  await shutdownLogger();
});

const group = { conversationId: '987', conversationShortId: '999', conversationType: 2, name: '测试群', members: [] };
const friend = { uid: '200', nickname: '好友', conversationId: '0:1:100:200', conversationShortId: '888' };
class Client extends EventEmitter {
  calls = [];
  connected = false;
  response = { statusCode: 0, statusMsg: '', serverMessageId: '1234567890123456789' };
  async start() {
    this.connected = true;
    this.emit('ready');
  }
  stop() {
    this.connected = false;
    this.emit('close', {});
  }
  async getFriendList() {
    return [friend];
  }
  async getStrangerList() {
    return [];
  }
  async getGroupList() {
    return [group];
  }
  async getGroupMembers() {
    return [{ uid: '200', nickname: '成员', role: 0 }];
  }
  async getGroupJoinRequests() {
    return [{ requestId: 'req1', applicantUid: '200', groupShortId: '999', status: 1 }];
  }
  async getChatHistory() {
    return [{ msgId: 'old', senderUid: '200', content: '{"text":"旧消息"}', msgType: 7, indexInConversation: '33' }];
  }
  async sendText(...args) {
    this.calls.push(['text', ...args]);
    return this.response;
  }
  async reply(...args) {
    this.calls.push(['reply', ...args]);
    return this.response;
  }
  async recall(...args) {
    this.calls.push(['recall', ...args]);
    return { statusCode: 0, recalled: true };
  }
  async modifyReaction(...args) {
    this.calls.push(['reaction', ...args]);
    return { statusCode: 0 };
  }
  async approveFriend(...args) {
    this.calls.push(['approve', ...args]);
    return { statusCode: 0 };
  }
  async rejectGroupJoin(...args) {
    this.calls.push(['rejectGroup', ...args]);
    return { statusCode: 0 };
  }
  async uploadImage(data) {
    this.calls.push(['upload', data]);
    return { oid: 'asset', skey: 'secret-key' };
  }
  async sendMedia(...args) {
    this.calls.push(['media', ...args]);
    return this.response;
  }
}
const setup = (ids = ['100']) => {
  const events = [];
  const accounts = new Map(ids.map(platformUid => [platformUid, { platformUid, config: {}, client: new Client() }]));
  const adapter = new DouyinAdapter(accounts, event => events.push(event));
  return { adapter, events, accounts, client: accounts.get(ids[0]).client };
};
const incoming = (overrides = {}) => ({
  ...friend,
  conversationType: 1,
  senderUid: '200',
  serverMessageId: 'm1',
  messageType: 7,
  content: '{"text":"你好"}',
  text: '你好',
  parsed: { kind: 'text', text: '你好' },
  raw: { cookie: 'never-emit' },
  ...overrides
});
const send = { UserId: '200', params: { format: [{ type: 'Text', value: 'hello' }] } };

test('direct sends resolve peer UID to full address and return framework message id', async () => {
  const { adapter, client } = setup();
  const [response] = await adapter.handle('message.send.user', send);
  assert.equal(response.code, ResultCode.Ok);
  assert.equal(response.data.id, '1234567890123456789');
  assert.deepEqual(client.calls[0][1], { conversationId: friend.conversationId, conversationShortId: '888', conversationType: 1 });
});

test('multi-account routing rejects ambiguous, conflicting and nonexistent bots', async () => {
  const { adapter, accounts } = setup(['100', '101']);
  for (const payload of [send, { ...send, BotId: 'missing' }, { ...send, BotId: '100', target: { BotId: '101', scope: 'c2c', targetId: '200' } }]) {
    assert.equal((await adapter.handle('message.send.user', payload))[0].code, ResultCode.FailParams);
  }
  assert.equal((await adapter.handle('message.send.user', { ...send, BotId: '101' }))[0].code, ResultCode.Ok);
  assert.equal(accounts.get('100').client.calls.length, 0);
  assert.equal(accounts.get('101').client.calls.length, 1);
});

test('unsupported scopes and message segments fail before sending partial content', async () => {
  const { adapter, client } = setup();
  assert.equal(
    (await adapter.handle('message.send.target', { target: { scope: 'channel', targetId: '987' }, params: send.params }))[0].code,
    ResultCode.FailParams
  );
  assert.equal(
    (await adapter.handle('message.send.user', { ...send, params: { format: [...send.params.format, { type: 'Audio', value: 'base64://YQ==' }] } }))[0].code,
    ResultCode.FailParams
  );
  assert.equal(client.calls.length, 0);
});

test('quoted reply uses cached reference metadata and rejects another conversation', async () => {
  const { adapter, client, events } = setup();
  adapter.receiveMessage('100', incoming());
  assert.equal((await adapter.handle('message.send', { event: events[0], params: { ...send.params, replyId: 'm1' } }))[0].code, ResultCode.Ok);
  assert.equal(client.calls[0][0], 'reply');
  assert.equal(client.calls[0][1].referencedUid, '200');
  assert.equal(client.calls[0][1].referencedMessageId, 'm1');
  assert.equal((await adapter.handle('message.send.channel', { ChannelId: '987', params: { ...send.params, replyId: 'm1' } }))[0].code, ResultCode.FailParams);
  assert.equal(client.calls.length, 1);
});

test('private event fields, mention detection and sanitized value follow framework contract', async () => {
  const { adapter, events } = setup();
  adapter.receiveMessage('100', incoming({ content: buildDesktopTextContent('@bot', [{ uid: '100', text: '@bot', location: 0, length: 4 }]) }));
  assert.equal(events[0].name, 'private.message.create');
  assert.equal(events[0].OpenId, '200');
  assert.equal(events[0].IsAtMe, true);
  assert.equal(events[0].BotId, '100');
  assert.ok(!JSON.stringify(events[0]).includes('never-emit'));
  assert.equal((await adapter.handle('mention.get', { event: events[0] }))[0].data[0].UserId, '100');
});

test('recall, member facts and friend requests do not share the wrong event names', async () => {
  const { adapter, events } = setup();
  adapter.receiveNotice('100', { type: 'message.recall', conversationId: friend.conversationId, conversationType: 1, serverMessageId: 'm1' });
  adapter.receiveNotice('100', { type: 'group.member-decrease', ...group, members: [{ uid: '200' }], operators: [{ uid: '300' }], source: 'kick' });
  adapter.receiveNotice('100', { type: 'friend.increase', peerUid: '200' });
  adapter.receiveNotice('100', { type: 'friend.decrease', peerUid: '200' });
  await adapter.receiveRequest('100', { type: 'friend.request', applicantUid: '200' });
  await adapter.receiveRequest('100', { type: 'group.join-request', ...group });
  assert.deepEqual(
    events.map(event => event.name),
    ['private.message.delete', 'member.remove', 'private.notice.create', 'private.friend.remove', 'private.friend.add', 'private.guild.add']
  );
  assert.equal(events[1].UserId, '200');
  assert.deepEqual(events[1]._operators, ['300']);
  assert.equal(events[5]._flag, 'req1');
  assert.equal(events[5].UserId, '200');
});

test('private reaction uses a private notice; public reaction retains channel', () => {
  const { adapter, events } = setup();
  adapter.receiveMessage('100', incoming({ ...group }));
  for (const conversationId of [friend.conversationId, group.conversationId]) {
    adapter.receiveNotice('100', { type: 'message.reaction', conversationId, serverMessageId: 'm1', operatorUid: '200', emoji: '[爱心]', isSet: true });
  }
  assert.equal(events[1].name, 'private.notice.create');
  assert.equal(events[2].name, 'message.reaction.add');
  assert.equal(events[2].ChannelId, '987');
});

test('malformed, moderated and failed SDK responses never report send success', async () => {
  const { adapter, client } = setup();
  for (const response of [
    {},
    { statusCode: 1 },
    { statusCode: 0 },
    { statusCode: 0, serverMessageId: '0' },
    { statusCode: 0, checkCode: 10502, serverMessageId: '1' }
  ]) {
    client.response = response;
    assert.notEqual((await adapter.handle('message.send.user', send))[0].code, ResultCode.Ok);
  }
  client.sendText = async () => {
    throw new Error('cookie=session-secret');
  };
  assert.ok(!JSON.stringify(await adapter.handle('message.send.user', send)).includes('session-secret'));
});

test('group recall and reactions resolve group address and validate emoji', async () => {
  const { adapter, client } = setup();
  assert.equal((await adapter.handle('message.delete', { ChannelId: '987', MessageId: 'm1' }))[0].code, ResultCode.Ok);
  assert.equal(client.calls[0][1].conversationType, 2);
  assert.equal((await adapter.handle('reaction.add', { ChannelId: '987', MessageId: 'm1' }))[0].code, ResultCode.FailParams);
  assert.equal(client.calls.length, 1);
});

test('approvals require explicit boolean and route exact request identifiers', async () => {
  const { adapter, client } = setup();
  assert.equal((await adapter.handle('request.friend', { params: { flag: '200', approve: 'false' } }))[0].code, ResultCode.FailParams);
  assert.equal((await adapter.handle('request.friend', { params: { flag: '200', approve: true } }))[0].code, ResultCode.Ok);
  assert.equal((await adapter.handle('request.guild', { params: { flag: 'req1', approve: false, subType: 'add' } }))[0].code, ResultCode.Ok);
  assert.deepEqual(client.calls, [
    ['approve', '200'],
    ['rejectGroup', 'req1']
  ]);
});

test('connection lifecycle includes reconnect readiness and stop is idempotent', async () => {
  const { adapter, accounts, client, events } = setup();
  await adapter.start(accounts.get('100'));
  assert.equal(adapter.getStatus().state, 'ready');
  client.emit('reconnecting', { attempt: 2 });
  assert.equal(adapter.getStatus().bots[0].reconnectAttempts, 2);
  client.emit('ready');
  assert.equal(events[1].resumed, true);
  adapter.stop();
  adapter.stop();
  client.emit('message', incoming());
  assert.equal(events.length, 2);
  assert.equal(adapter.getStatus().state, 'stopped');
  assert.equal(client.listenerCount('message'), 0);
  assert.equal((await adapter.handle('message.send.user', send))[0].code, ResultCode.Fail);
});

test('mixed image/text sends preserve order; cached media tokens cannot cross accounts', async () => {
  const { adapter, client } = setup(['100', '101']);
  const responses = await adapter.handle('message.send.user', {
    ...send,
    BotId: '100',
    params: { format: [send.params.format[0], { type: 'Image', value: 'base64://YQ==' }, { type: 'Text', value: '尾部' }] }
  });
  assert.equal(responses.length, 3);
  assert.ok(responses.every(response => response.code === ResultCode.Ok));
  assert.deepEqual(
    client.calls.map(call => call[0]),
    ['upload', 'text', 'media', 'text']
  );
  const [upload] = await adapter.handle('media.upload', { BotId: '100', params: { type: 'image', data: 'YQ==' } });
  assert.ok(!JSON.stringify(upload).includes('secret-key'));
  assert.equal(
    (await adapter.handle('media.send.user', { BotId: '101', UserId: '200', params: { type: 'image', fileId: upload.data.fileId } }))[0].code,
    ResultCode.FailParams
  );
});

test('history rejects unsupported direction; query and unsupported actions always resolve', async () => {
  const { adapter } = setup();
  assert.equal((await adapter.handle('history.list', { ChannelId: '987', params: { after: 'old' } }))[0].code, ResultCode.FailParams);
  assert.equal((await adapter.handle('message.get', { MessageId: 'unknown' }))[0].code, ResultCode.FailParams);
  assert.equal((await adapter.handle('member.list', { GuildId: '987' }))[0].data.Items[0].UserId, '200');
  assert.equal((await adapter.handle('guild.info', { GuildId: '987' }))[0].data.GuildName, '测试群');
  assert.equal((await adapter.handle('not.supported'))[0].code, ResultCode.Fail);
});

test('structured markdown becomes plain text without object placeholders', async () => {
  const { adapter, client } = setup();
  await adapter.handle('message.send.user', {
    ...send,
    params: {
      format: [
        {
          type: 'Markdown',
          value: [{ type: 'MD.bold', value: '标题' }, { type: 'MD.newline' }, { type: 'MD.link', value: { text: '文档', url: 'https://example.com' } }]
        }
      ]
    }
  });
  assert.equal(client.calls[0][2], '标题\n文档 (https://example.com)');
});

test('media loader rejects unsupported schemes, malformed data and oversized data offline', async () => {
  assert.deepEqual(await loadMedia('base64://YQ=='), Buffer.from('a'));
  await assert.rejects(loadMedia('ftp://example.com/file'));
  await assert.rejects(loadMedia('base64://!!'));
  await assert.rejects(loadMedia(`base64://${'a'.repeat(14 * 1024 * 1024)}`));
});

test('runtime QR persistence, transport readiness and CBP consume follow lifecycle order', async () => {
  const events = [];
  const accounts = new Map();
  let onAction;
  let persisted = false;
  const manager = {
    accounts,
    restore: async () => {},
    stop: () => {},
    async loginByQr(options) {
      options.onQr({ qrcodeBase64: 'aW1hZ2U=', token: 'secret-token' });
      const account = { platformUid: '100', client: new Client(), config: {} };
      accounts.set('100', account);
      persisted = true;
      return account;
    }
  };
  const runtime = startDirectAdapter(
    {},
    {
      manager,
      bindSignals: false,
      cbp: {
        send(event) {
          if (event.name === 'login.success') {
            assert.equal(persisted, true);
          }
          events.push(event);
        },
        onactions(callback) {
          onAction = callback;
        }
      }
    }
  );
  await runtime.ready;
  assert.deepEqual(
    events.map(event => event.name),
    ['login.qrcode', 'login.success', 'connection.ready']
  );
  assert.notEqual(events[0].LoginId, 'secret-token');
  assert.equal(events[0].LoginId, events[1].LoginId);
  const results = await new Promise(resolve => onAction({ action: 'connection.status', payload: {} }, resolve));
  assert.equal(results[0].data.login.state, 'authorized');
  assert.equal(results[0].data.state, 'ready');
  let consumed = 0;
  await new Promise(resolve =>
    onAction({ action: 'unknown', payload: {} }, result => {
      consumed++;
      assert.equal(result.length, 1);
      resolve();
    })
  );
  assert.equal(consumed, 1);
  runtime.stop();
});

test('stop during address resolution prevents a late send', async () => {
  const { adapter, client } = setup();
  let resolve;
  client.getFriendList = () =>
    new Promise(done => {
      resolve = done;
    });
  const pending = adapter.handle('message.send.user', send);
  adapter.stop();
  resolve([friend]);
  assert.notEqual((await pending)[0].code, ResultCode.Ok);
  assert.equal(client.calls.length, 0);
});

test('stop while restoring prevents QR login or account connection', async () => {
  let restore;
  let loggedIn = false;
  const runtime = startDirectAdapter(
    {},
    {
      bindSignals: false,
      cbp: {
        send() {
          assert.fail('No late events');
        },
        onactions() {}
      },
      manager: {
        accounts: new Map(),
        stop() {},
        restore: () =>
          new Promise(resolve => {
            restore = resolve;
          }),
        loginByQr() {
          loggedIn = true;
        }
      }
    }
  );
  runtime.stop();
  restore();
  await runtime.ready;
  assert.equal(loggedIn, false);
});

test('native mentions preserve UTF-16 offsets and whitespace segments', async () => {
  const { adapter, client } = setup();
  const results = await adapter.handle('message.send.user', {
    ...send,
    params: {
      format: [
        { type: 'Text', value: '😀' },
        { type: 'Text', value: ' ' },
        { type: 'Mention', options: { payload: { UserId: '200' } } }
      ]
    }
  });
  assert.equal(results[0].code, ResultCode.Ok);
  assert.equal(client.calls[0][2], '😀 @200');
  assert.equal(client.calls[0][3][0].location, 3);
});

test('partial mixed-message failure returns preceding success and skips remaining content', async () => {
  const { adapter, client } = setup();
  client.sendMedia = async () => {
    throw new Error('transport failed');
  };
  const results = await adapter.handle('message.send.user', {
    ...send,
    params: {
      format: [
        { type: 'Text', value: 'first' },
        { type: 'Image', value: 'base64://YQ==' },
        { type: 'Text', value: 'last' }
      ]
    }
  });
  assert.deepEqual(
    results.map(result => result.code),
    [ResultCode.Ok, ResultCode.FailInternal]
  );
  assert.equal(client.calls.filter(call => call[0] === 'text').length, 1);
});

test('structured quotes support every leaf on reply and proactive send paths', async () => {
  for (const action of ['message.send', 'message.send.user', 'message.send.channel', 'message.send.target']) {
    const { adapter, client } = setup();
    const payload =
      action === 'message.send.channel'
        ? { ChannelId: '987' }
        : action === 'message.send.target'
        ? { target: { scope: 'c2c', targetId: '200' } }
        : { UserId: '200' };
    const [response] = await adapter.handle(action, {
      ...payload,
      params: {
        format: [
          {
            type: 'Markdown',
            value: [
              {
                type: 'MD.blockquote',
                value: [
                  { type: 'MD.bold', value: 'BOLD' },
                  { type: 'MD.link', value: { text: 'LINK' } },
                  { type: 'MD.mention', value: '200' },
                  { type: 'MD.image', value: 'https://example.com/image.png' },
                  { type: 'MD.button', value: 'BUTTON', options: { data: '/command' } },
                  { type: 'MD.blockquote', value: 'NESTED\n\nPARAGRAPH' }
                ]
              }
            ]
          }
        ]
      }
    });
    assert.equal(response.code, ResultCode.Ok, JSON.stringify(response));
    const text = client.calls.find(call => call[0] === 'text')[2];
    for (const label of ['BOLD', 'LINK', '@200', '[图片]', 'BUTTON', '> > NESTED', '> > PARAGRAPH']) {
      assert.ok(text.includes(label), `${action} lost ${label}: ${text}`);
    }
    assert.doesNotMatch(text, /\[object Object\]|undefined/);
  }
});
