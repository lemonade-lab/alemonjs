import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import { createDriver as slack } from '../../packages/slack/src/driver.ts';
import { createDriver as feishu } from '../../packages/feishu/src/driver.ts';
import { createDriver as matrix } from '../../packages/matrix/src/driver.ts';
import { createDriver as mattermost } from '../../packages/mattermost/src/driver.ts';
import { createDriver as twitch } from '../../packages/twitch/src/driver.ts';
import { createDriver as teams } from '../../packages/teams/src/driver.ts';
import { createDriver as google } from '../../packages/google-chat/src/driver.ts';
import { createDriver as irc } from '../../packages/irc/src/driver.ts';
import { createDriver as icqq } from '../../packages/icqq/src/driver.ts';
import { createDriver as ding } from '../../packages/dingtalk/src/driver.ts';
import { createDriver as zulip } from '../../packages/zulip/src/driver.ts';
import { createDriver as heybox } from '../../packages/heybox/src/driver.ts';

function context(config) {
  const events = [];
  return { config, events, platform: 'test', emit: e => events.push(e), ready() {}, state() {} };
}
const content = [{ type: 'Text', value: 'hello' }];
const send = { UserId: 'user', params: { format: content } };

test('all 18 packages import and require credentials before opening transports', async () => {
  for (const name of [
    'slack',
    'feishu',
    'line',
    'dingtalk',
    'matrix',
    'zulip',
    'mattermost',
    'twitch',
    'irc',
    'teams',
    'google-chat',
    'wechat-official',
    'wechat-kf',
    'heybox',
    'icqq',
    'whatsapp',
    'messenger',
    'instagram'
  ]) {
    const driver = await import(`../../packages/${name}/src/driver.ts`);
    await assert.rejects(async () => driver.createDriver(context({})), /Missing configuration/);
  }
});

test('Slack opens a DM, sends to conversation ID and returns Slack ts', async () => {
  const calls = [];
  const handlers = {};
  class App {
    client = {
      conversations: {
        open: async p => {
          calls.push(p);
          return { channel: { id: 'D123' } };
        }
      },
      chat: {
        postMessage: async p => {
          calls.push(p);
          return { ts: '1.2' };
        }
      }
    };
    event(name, cb) {
      handlers[name] = cb;
    }
    action() {}
  }
  const ctx = context({ bot_token: 'token', app_token: 'token' });
  const d = slack(ctx, { App });
  const r = await d.actions['message.send.user'](send);
  assert.equal(r.id, '1.2');
  assert.equal(calls[0].users, 'user');
  assert.equal(calls[1].channel, 'D123');
  await handlers.message({ event: { user: 'u', channel: 'D123', channel_type: 'im', ts: '1', text: 'hello' } });
  assert.equal(ctx.events[0].private, true);
});

test('Feishu distinguishes OpenID and chat IDs, checks API error codes', async () => {
  const calls = [];
  let fail = false;
  class Client {
    im = {
      message: {
        create: async p => {
          calls.push(p);
          return fail ? { code: 999, msg: 'denied' } : { code: 0, data: { message_id: 'm' } };
        }
      }
    };
  }
  class WSClient {
    async start() {}
    close() {}
  }
  class EventDispatcher {
    register() {
      return this;
    }
  }
  const d = feishu(context({ app_id: 'app', app_secret: 'secret' }), { Client, WSClient, EventDispatcher, Domain: {} });
  assert.equal((await d.actions['message.send.user'](send)).id, 'm');
  assert.equal(calls[0].params.receive_id_type, 'open_id');
  await d.actions['message.send.channel']({ ChannelId: 'chat', params: send.params });
  assert.equal(calls[1].params.receive_id_type, 'chat_id');
  fail = true;
  await assert.rejects(d.actions['message.send.user'](send), /denied/);
});

test('Matrix sends only to rooms and suppresses initial/backfill timeline replay', async () => {
  const client = new EventEmitter();
  const calls = [];
  client.sendMessage = async (...p) => {
    calls.push(p);
    return { event_id: '$sent' };
  };
  const ctx = context({ base_url: 'https://matrix.example', access_token: 't', user_id: '@bot:example' });
  const d = matrix(ctx, { createClient: () => client });
  assert.equal(d.actions['message.send.user'], undefined);
  await assert.rejects(
    d.actions['message.send.target']({ target: { scope: 'c2c', targetId: '@user:example' }, params: send.params }),
    /room ID/
  );
  assert.equal(
    (await d.actions['message.send.target']({ target: { scope: 'direct', targetId: '!room:example' }, params: send.params })).id,
    '$sent'
  );
  const e = {
    getSender: () => '@u:example',
    getContent: () => ({ body: 'hi' }),
    getType: () => 'm.room.message',
    getId: () => '$msg',
    event: {}
  };
  client.emit('Room.timeline', e, { roomId: '!room' }, false);
  assert.equal(ctx.events.length, 0);
  client.emit('sync', 'PREPARED');
  client.emit('Room.timeline', e, { roomId: '!room' }, true);
  assert.equal(ctx.events.length, 0);
  client.emit('Room.timeline', e, { roomId: '!room' }, false);
  assert.equal(ctx.events.length, 1);
});

test('Mattermost uses correct patch and reaction SDK signatures', async () => {
  const calls = [];
  class Client4 {
    setUrl() {}
    setToken() {}
    async getMe() {
      return { id: 'bot' };
    }
    async patchPost(p) {
      calls.push(p);
    }
    async addReaction(...args) {
      calls.push(args);
    }
    async createDirectChannel(ids) {
      calls.push(ids);
      return { id: 'dm' };
    }
    async createPost(p) {
      calls.push(p);
      return { id: 'm' };
    }
  }
  class WebSocketClient {
    setEventCallback() {}
    setCloseCallback() {}
    initialize() {}
    close() {}
  }
  const d = mattermost(context({ base_url: 'https://mm.example', token: 'token' }), { Client4, WebSocketClient });
  await d.start();
  assert.equal((await d.actions['message.send.user'](send)).id, 'm');
  await d.actions['message.edit']({ MessageId: 'm', params: send.params });
  await d.actions['reaction.add']({ MessageId: 'm', EmojiId: 'heart' });
  assert.equal(calls[1].channel_id, 'dm');
  assert.deepEqual(calls[2], { id: 'm', message: 'hello' });
  assert.deepEqual(calls[3], ['bot', 'm', 'heart']);
  await d.stop();
});

test('Twitch checks dropped messages instead of treating HTTP success as delivery', async () => {
  let sent = false;
  class ChatClient {
    onConnect() {}
    onDisconnect() {}
    onMessage() {}
    onMessageRemove() {}
  }
  class ApiClient {
    chat = { sendChatMessage: async () => ({ id: 'm', isSent: sent, dropReasonMessage: 'blocked' }) };
  }
  class StaticAuthProvider {}
  const d = twitch(context({ client_id: 'c', access_token: 't', user_id: 'b', channels: ['channel'] }), {
    ChatClient,
    ApiClient,
    StaticAuthProvider
  });
  const p = { ChannelId: '123', params: send.params };
  await assert.rejects(d.actions['message.send.channel'](p), /blocked/);
  sent = true;
  assert.equal((await d.actions['message.send.channel'](p)).id, 'm');
});

test('Teams preserves conversation IDs for private reply and direct session sends', async () => {
  const calls = [];
  class App {
    on() {}
    async send(...args) {
      calls.push(args);
      return { id: 'm' };
    }
  }
  const d = teams(context({ client_id: 'c', client_secret: 's', tenant_id: 't' }), { App });
  await d.actions['message.send']({ event: { IsPrivate: true, UserId: 'u', ChannelId: 'conv' }, params: send.params });
  assert.equal(calls[0][0], 'conv');
  await d.actions['message.send.target']({ target: { scope: 'direct', targetId: 'dm' }, params: send.params });
  assert.equal(calls[1][0], 'dm');
  await d.actions['message.send']({
    target: { scope: 'direct', targetId: 'another-dm' },
    event: { IsPrivate: true, UserId: 'u', ChannelId: 'conv' },
    params: send.params
  });
  assert.equal(calls[2][0], 'another-dm');
  await assert.rejects(d.actions['message.send.user'](send), /known conversation/);
});

test('Google Chat private replies use a space ID', async () => {
  const calls = [];
  class GoogleAuth {}
  class OAuth2Client {}
  const d = google(context({ audience: 'https://app.example', service_account_email: 'chat@system.gserviceaccount.com' }), {
    GoogleAuth,
    OAuth2Client,
    chat: () => ({
      spaces: {
        messages: {
          create: async p => {
            calls.push(p);
            return { data: { name: 'spaces/dm/messages/m' } };
          }
        }
      }
    })
  });
  const r = await d.actions['message.send']({ event: { IsPrivate: true, UserId: 'users/u', ChannelId: 'spaces/dm' }, params: send.params });
  assert.equal(calls[0].parent, 'spaces/dm');
  assert.equal(r.id, 'spaces/dm/messages/m');
  await d.actions['message.send']({
    target: { scope: 'direct', targetId: 'spaces/other' },
    event: { IsPrivate: true, UserId: 'users/u', ChannelId: 'spaces/dm' },
    params: send.params
  });
  assert.equal(calls[1].parent, 'spaces/other');
});

test('IRC rejects command injection and reports queued rather than fabricated IDs', async () => {
  class Client extends EventEmitter {
    connection = { connected: true };
    user = { nick: 'bot' };
    say(...p) {
      this.sent = p;
    }
  }
  const d = irc(context({ host: 'irc.example', nick: 'bot' }), { Client });
  assert.deepEqual(await d.actions['message.send.user'](send), { queued: true });
  await assert.rejects(async () => d.actions['message.send.user']({ ...send, UserId: 'u\r\nOPER root' }), /Invalid/);
});

test('ICQQ keeps IDs exact, maps segments and passes approval flags', async () => {
  const client = new EventEmitter();
  const calls = [];
  client.sendGroupMsg = async (...p) => {
    calls.push(p);
    return { message_id: 'm' };
  };
  client.setFriendAddRequest = async (...p) => {
    calls.push(p);
    return true;
  };
  const d = await icqq(context({ uin: '123' }), { createClient: () => client, segment: { at: id => ({ type: 'at', id }) } });
  assert.equal(
    (await d.actions['message.send.channel']({ ChannelId: '456', params: { format: [{ type: 'Mention', value: '789' }] } })).id,
    'm'
  );
  assert.equal(calls[0][1][0].id, 789);
  await assert.rejects(d.actions['message.send.channel']({ ChannelId: '9007199254740993', params: send.params }), /numeric ID/);
  await d.actions['request.friend']({ params: { flag: 'flag', approve: true } });
  assert.deepEqual(calls[1], ['flag', true]);
});

test('DingTalk ACKs accepted frames without leaking session webhook credentials', async () => {
  const handlers = {};
  const ack = [];
  class DWClient {
    registerCallbackListener(topic, cb) {
      handlers[topic] = cb;
    }
    socketCallBackResponse(...args) {
      ack.push(args);
    }
  }
  const ctx = context({ client_id: 'c', client_secret: 's', robot_code: 'bot' });
  ding(ctx, { DWClient, TOPIC_ROBOT: 'robot', TOPIC_CARD: 'card' });
  handlers.robot({
    headers: { messageId: 'frame' },
    data: JSON.stringify({
      msgId: 'm',
      senderStaffId: 'u',
      conversationType: '1',
      chatbotUserId: 'b',
      text: { content: 'hi' },
      sessionWebhook: 'https://oapi.dingtalk.com/robot/send?access_token=secret',
      sessionWebhookExpiredTime: Date.now() + 1000
    })
  });
  assert.equal(ack[0][0], 'frame');
  assert.equal(ctx.events[0].raw.sessionWebhook, undefined);
});

test('Zulip requires a topic and sends numeric user IDs', async () => {
  const sent = [];
  const client = {
    messages: {
      send: async p => {
        sent.push(p);
        return { result: 'success', id: 1 };
      }
    }
  };
  const d = await zulip(context({ realm: 'https://zulip.example', email: 'bot@example.com', api_key: 't' }), async () => client);
  await assert.rejects(d.actions['message.send.channel']({ ChannelId: 'stream', params: send.params }), /topic/);
  await d.actions['message.send.user']({ UserId: '123', params: send.params });
  assert.equal(sent[0].to, '[123]');
});

test('installed SDK APIs used by the adapters exist', async () => {
  const lark = await import('@larksuiteoapi/node-sdk');
  const lc = new lark.Client({ appId: 'app', appSecret: 'secret' });
  for (const path of ['message.create', 'message.reply', 'message.update', 'chat.get', 'chatMembers.get', 'messageReaction.create']) {
    const [resource, method] = path.split('.');
    assert.equal(typeof lc.im[resource][method], 'function', path);
  }
  const mm = createRequire(import.meta.url)('@mattermost/client');
  const mc = new mm.Client4();
  for (const method of ['getMyChannels', 'getMyTeams', 'patchPost', 'addReaction', 'removeReaction', 'uploadFile', 'removeFromChannel'])
    assert.equal(typeof mc[method], 'function', method);
});

test('Twitch whisper events use the real EventSub field names', async () => {
  let incoming;
  const sent = [];
  class ChatClient {
    onConnect() {}
    onDisconnect() {}
    onMessage() {}
    onMessageRemove() {}
  }
  class StaticAuthProvider {}
  class ApiClient {
    whispers = {
      sendWhisper: async (...args) => {
        sent.push(args);
      }
    };
  }
  class EventSubWsListener {
    onUserWhisperMessage(user, cb) {
      incoming = cb;
    }
    onSubscriptionCreateFailure() {}
  }
  const ctx = context({ client_id: 'c', access_token: 't', user_id: 'bot', channels: [], whispers: true });
  const d = twitch(ctx, { ChatClient, StaticAuthProvider, ApiClient, EventSubWsListener });
  incoming({ senderUserId: 'u', senderUserDisplayName: 'Ada', id: 'whisper', userId: 'bot', messageText: 'hello' });
  assert.equal(ctx.events[0].user, 'u');
  assert.equal(ctx.events[0].text, 'hello');
  assert.equal(ctx.events[0].id, 'whisper');
  await d.actions['message.send.user'](send);
  assert.deepEqual(sent[0], ['bot', 'user', 'hello']);
});

test('Heybox maps real command names, options and media from its protocol frame', async () => {
  let socket;
  class Socket extends EventEmitter { static OPEN = 1; constructor() { super(); socket = this; } close() { this.emit('close'); } }
  const ctx = context({ token: 'token', bot_id: 'bot' }); const driver = heybox(ctx, Socket); driver.start();
  socket.emit('message', Buffer.from(JSON.stringify({ type: '50', data: { msg_id: 'm', sender_info: { user_id: 42 }, channel_base_info: { channel_id: 'c' }, room_base_info: { room_id: 'r' }, command_info: { name: 'echo', options: [{ value: 'hello' }], images: [{ id: 'image', url: 'https://example.com/a.png', name: 'a.png' }], files: [] } } })));
  assert.equal(ctx.events[0].user, '42'); assert.equal(ctx.events[0].text, 'echo hello'); assert.equal(ctx.events[0].media[0].Type, 'image');
  driver.stop();
});
