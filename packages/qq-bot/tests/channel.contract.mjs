import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  useAnnounce,
  useAudio,
  useChannel,
  useChannelSettings,
  useForum,
  useGuild,
  useMember,
  useMessage,
  usePermission,
  useReaction,
  useRole,
  useSchedule,
  ResultCode
} from 'alemonjs';
import { QQBotAPI } from '../lib/sdk/api.js';
import { register } from '../lib/register.js';
import { setDirectSend } from '../../alemonjs/lib/application/runtime/cbp/processor/transport.js';
import { actionRequestResolves, actionRequestTimeouts } from '../../alemonjs/lib/application/runtime/cbp/processor/request-registry.js';

const configPath = resolve('alemon.config.yaml');
const hadConfig = existsSync(configPath);
process.on('exit', () => {
  if (!hadConfig && existsSync(configPath) && readFileSync(configPath, 'utf8').trim() === '{}') rmSync(configPath);
});

const calls = [];
const handlers = new Map();
const emitted = [];
const client = new QQBotAPI({ app_id: 'app' });
client.on = (name, handler) => handlers.set(name, handler);
client.guildServer = async request => {
  calls.push(request);
  return {};
};
const adapter = register(client, { botId: 'app', cbp: { send: event => emitted.push(event), onactions() {}, onapis() {} } });
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

const check = async (run, method, url) => {
  const before = calls.length;
  const result = await run();
  assert.equal(result.code, ResultCode.Ok, JSON.stringify(result));
  assert.equal(calls.length, before + 1, `${method} ${url} should issue one request`);
  const request = calls.at(-1);
  assert.equal((request.method ?? 'GET').toUpperCase(), method);
  assert.equal(request.url, url);
  return request;
};

// No event is required: proactive jobs pass the resource IDs explicitly.
const [schedule] = useSchedule();
const scheduleBody = { name: 'name', start_timestamp: '1', end_timestamp: '2', jump_channel_id: 'next', remind_type: 0 };
assert.equal((await check(() => schedule.list({ channelId: 'channel', since: 'cursor' }), 'GET', '/channels/channel/schedules')).params.since, 'cursor');
await check(() => schedule.get({ channelId: 'channel', scheduleId: 'schedule' }), 'GET', '/channels/channel/schedules/schedule');
await check(() => schedule.create({ channelId: 'channel', schedule: scheduleBody }), 'POST', '/channels/channel/schedules');
await check(() => schedule.update({ channelId: 'channel', scheduleId: 'schedule', schedule: scheduleBody }), 'PATCH', '/channels/channel/schedules/schedule');
await check(() => schedule.remove({ channelId: 'channel', scheduleId: 'schedule' }), 'DELETE', '/channels/channel/schedules/schedule');

const [forum] = useForum();
await check(() => forum.list({ channelId: 'channel' }), 'GET', '/channels/channel/threads');
await check(() => forum.get({ channelId: 'channel', threadId: 'thread' }), 'GET', '/channels/channel/threads/thread');
await check(() => forum.create({ channelId: 'channel', title: 'title', content: 'content', format: 3 }), 'PUT', '/channels/channel/threads');
await check(() => forum.remove({ channelId: 'channel', threadId: 'thread' }), 'DELETE', '/channels/channel/threads/thread');

const [audio] = useAudio();
await check(() => audio.control({ channelId: 'channel', status: 0, audioUrl: 'https://example.com/a.mp3' }), 'POST', '/channels/channel/audio');
await check(() => audio.join({ channelId: 'channel' }), 'PUT', '/channels/channel/mic');
await check(() => audio.leave({ channelId: 'channel' }), 'DELETE', '/channels/channel/mic');
await check(() => audio.online({ channelId: 'channel' }), 'GET', '/channels/channel/online_nums');

const [settings] = useChannelSettings();
await check(() => settings.messageRate({ guildId: 'guild' }), 'GET', '/guilds/guild/message/setting');
await check(() => settings.permissions({ guildId: 'guild' }), 'GET', '/guilds/guild/api_permission');
await check(
  () => settings.requestPermission({ guildId: 'guild', channelId: 'channel', path: '/channels/{channel_id}/messages', method: 'POST' }),
  'POST',
  '/guilds/guild/api_permission/demand'
);
await check(() => settings.openDirectSession({ userId: 'user', sourceGuildId: 'guild' }), 'POST', '/users/@me/dms');
await check(() => settings.setLegacyAnnouncement({ channelId: 'channel', messageId: 'message' }), 'POST', '/channels/channel/announces');
await check(() => settings.removeLegacyAnnouncement({ channelId: 'channel', messageId: 'message' }), 'DELETE', '/channels/channel/announces/message');

const [channel] = useChannel();
await check(() => channel.info({ channelId: 'channel' }), 'GET', '/channels/channel');
await check(() => channel.list({ guildId: 'guild' }), 'GET', '/guilds/guild/channels');
await check(() => channel.create({ guildId: 'guild', name: 'new', type: '0' }), 'POST', '/guilds/guild/channels');
await check(() => channel.update({ channelId: 'channel', name: 'renamed' }), 'PATCH', '/channels/channel');
await check(() => channel.delete({ channelId: 'channel' }), 'DELETE', '/channels/channel');

const [permission] = usePermission();
await check(() => permission.get({ channelId: 'channel', userId: 'user' }), 'GET', '/channels/channel/members/user/permissions');
await check(() => permission.set({ channelId: 'channel', userId: 'user', allow: '1', deny: '0' }), 'PUT', '/channels/channel/members/user/permissions');
await check(() => permission.getRole({ channelId: 'channel', roleId: 'role' }), 'GET', '/channels/channel/roles/role/permissions');
await check(() => permission.setRole({ channelId: 'channel', roleId: 'role', allow: '1', deny: '0' }), 'PUT', '/channels/channel/roles/role/permissions');

const [reaction] = useReaction();
await check(
  () => reaction.add({ channelId: 'channel', messageId: 'message', emojiId: 'emoji' }),
  'PUT',
  '/channels/channel/messages/message/reactions/1/emoji'
);
await check(
  () => reaction.remove({ channelId: 'channel', messageId: 'message', emojiId: 'emoji' }),
  'DELETE',
  '/channels/channel/messages/message/reactions/1/emoji'
);
await check(
  () => reaction.list({ channelId: 'channel', messageId: 'message', emojiId: 'emoji', limit: 10 }),
  'GET',
  '/channels/channel/messages/message/reactions/1/emoji'
);

const [role] = useRole();
await check(() => role.list({ guildId: 'guild' }), 'GET', '/guilds/guild/roles');
await check(() => role.create({ guildId: 'guild', name: 'new' }), 'POST', '/guilds/guild/roles');
await check(() => role.update({ guildId: 'guild', roleId: 'role', name: 'renamed' }), 'PATCH', '/guilds/guild/roles/role');
await check(() => role.delete({ guildId: 'guild', roleId: 'role' }), 'DELETE', '/guilds/guild/roles/role');
assert.deepEqual(
  (await check(() => role.assign({ guildId: 'guild', channelId: 'channel', userId: 'user', roleId: 'role' }), 'PUT', '/guilds/guild/members/user/roles/role'))
    .data.channel,
  { id: 'channel' }
);
assert.deepEqual(
  (
    await check(
      () => role.remove({ guildId: 'guild', channelId: 'channel', userId: 'user', roleId: 'role' }),
      'DELETE',
      '/guilds/guild/members/user/roles/role'
    )
  ).data.channel,
  { id: 'channel' }
);

const [announce] = useAnnounce();
await check(() => announce.set({ guildId: 'guild', channelId: 'channel', messageId: 'message' }), 'POST', '/guilds/guild/announces');
await check(() => announce.remove({ guildId: 'guild', messageId: 'message' }), 'DELETE', '/guilds/guild/announces/message');

const guildContext = {
  Platform: 'qq-bot',
  BotId: 'app',
  GuildId: 'guild',
  ChannelId: 'channel',
  Target: { scope: 'channel', targetId: 'channel', BotId: 'app' }
};
const [guild] = useGuild(guildContext);
await check(() => guild.info(), 'GET', '/guilds/guild');
await check(() => guild.list(), 'GET', '/users/@me/guilds');
const [member] = useMember(guildContext);
await check(() => member.info({ userId: 'user' }), 'GET', '/guilds/guild/members/user');
await check(() => member.list(), 'GET', '/guilds/guild/members');
await check(() => member.kick({ userId: 'user' }), 'DELETE', '/guilds/guild/members/user');
const [message] = useMessage({ ...guildContext, MessageId: 'message' });
await check(() => message.get(), 'GET', '/channels/channel/messages/message');
await check(() => message.delete(), 'DELETE', '/channels/channel/messages/message?hidetip=true');
await check(() => message.pin(), 'PUT', '/channels/channel/pins/message');
await check(() => message.unpin(), 'DELETE', '/channels/channel/pins/message');

// Every declared channel-only gateway event is registered, reaches AlemonJS,
// and retains the untouched QQ event body in `value`.
const channelEvents = [
  'MESSAGE_AUDIT_PASS',
  'MESSAGE_AUDIT_REJECT',
  'READY',
  'FORUM_THREAD_CREATE',
  'FORUM_THREAD_UPDATE',
  'FORUM_THREAD_DELETE',
  'FORUM_POST_CREATE',
  'FORUM_POST_DELETE',
  'FORUM_REPLY_CREATE',
  'FORUM_REPLY_DELETE',
  'FORUM_PUBLISH_AUDIT_RESULT',
  'AUDIO_START',
  'AUDIO_FINISH',
  'AUDIO_ON_MIC',
  'AUDIO_OFF_MIC',
  'AUDIO_OR_LIVE_CHANNEL_MEMBER_ENTER',
  'AUDIO_OR_LIVE_CHANNEL_MEMBER_EXIT'
];
for (const tag of channelEvents) {
  assert(handlers.has(tag), `Missing channel event listener: ${tag}`);
  const event =
    tag === 'READY'
      ? { user: { id: 'bot', name: 'Bot' } }
      : tag.startsWith('MESSAGE_AUDIT')
      ? { guild_id: 'guild', channel_id: 'channel', audit_id: 'audit', audit_time: '1', message_id: 'message' }
      : { guild_id: 'guild', channel_id: 'channel', author_id: 'author', user_id: 'user' };
  const before = emitted.length;
  await handlers.get(tag)(event);
  assert.equal(emitted.length, before + 1, `${tag} should emit exactly once`);
  assert.equal(emitted.at(-1).value, event, `${tag} must retain raw QQ payload`);
  assert.equal(emitted.at(-1)._tag, tag);
}

const author = { id: 'user', username: 'User', bot: false };
const messageEvent = { id: 'message', guild_id: 'guild', channel_id: 'channel', author, content: 'hello', attachments: [] };
const channelCoreEvents = [
  ['CHANNEL_CREATE', { id: 'channel', guild_id: 'guild' }, 'channel.create'],
  ['CHANNEL_DELETE', { id: 'channel', guild_id: 'guild' }, 'channel.delete'],
  ['CHANNEL_UPDATE', { id: 'channel', guild_id: 'guild' }, 'channel.update'],
  ['GUILD_CREATE', { id: 'guild', op_user_id: 'user' }, 'guild.join'],
  ['GUILD_DELETE', { id: 'guild', op_user_id: 'user' }, 'guild.exit'],
  ['GUILD_UPDATE', { id: 'guild' }, 'guild.update'],
  ['GUILD_MEMBER_ADD', { guild_id: 'guild', user: author }, 'member.add'],
  ['GUILD_MEMBER_REMOVE', { guild_id: 'guild', user: author }, 'member.remove'],
  ['GUILD_MEMBER_UPDATE', { guild_id: 'guild', user: author }, 'member.update'],
  ['AT_MESSAGE_CREATE', messageEvent, 'message.create'],
  ['MESSAGE_CREATE', messageEvent, 'message.create'],
  ['DIRECT_MESSAGE_CREATE', { ...messageEvent, direct_message: true }, 'private.message.create'],
  ['MESSAGE_DELETE', { message: messageEvent }, 'message.delete'],
  ['PUBLIC_MESSAGE_DELETE', { message: messageEvent }, 'message.delete'],
  ['DIRECT_MESSAGE_DELETE', { message: messageEvent }, 'private.message.delete'],
  ['MESSAGE_REACTION_ADD', { guild_id: 'guild', channel_id: 'channel', target: { id: 'message' }, user_id: 'user' }, 'message.reaction.add'],
  ['MESSAGE_REACTION_REMOVE', { guild_id: 'guild', channel_id: 'channel', target: { id: 'message' }, user_id: 'user' }, 'message.reaction.remove']
];
for (const [tag, event, name] of channelCoreEvents) {
  assert(handlers.has(tag), `Missing channel event listener: ${tag}`);
  const before = emitted.length;
  await handlers.get(tag)(event);
  assert.equal(emitted.length, before + 1, `${tag} should emit exactly once`);
  assert.equal(emitted.at(-1).name, name);
  assert.equal(emitted.at(-1).value, event, `${tag} must retain raw QQ payload`);
  assert.equal(emitted.at(-1)._tag, tag);
}

console.log(`Verified ${calls.length} channel framework actions and ${channelEvents.length + channelCoreEvents.length} channel gateway events.`);
if (!hadConfig && existsSync(configPath) && readFileSync(configPath, 'utf8').trim() === '{}') rmSync(configPath);
process.exit(0);
