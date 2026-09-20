import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
// This is the entire application-facing import surface under test.
import {
  useMention,
  useGuild,
  useMember,
  useRequest,
  useMenu,
  usePanel,
  useMe,
  useMessage,
  useMedia,
  useConnection,
  useInteraction,
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
const root = new URL('../docs/official/non-channel/', import.meta.url);
const reference = JSON.parse(readFileSync(new URL('./fixtures/non-channel.json', import.meta.url)));
const expected = new Map(reference.api.map(item => [item.endpoint.replace(/\{[^}]+\}/g, 'ID'), item.source]));
const group = {
  Platform: 'qq-bot',
  BotId: 'app',
  GuildId: 'ID',
  ChannelId: 'ID',
  SpaceId: 'GROUP:ID',
  Target: { scope: 'group', targetId: 'ID', BotId: 'app' }
};
const c2c = { Platform: 'qq-bot', BotId: 'app', UserId: 'ID', IsPrivate: true, Target: { scope: 'c2c', targetId: 'ID', BotId: 'app' } };
const member = { member_openid: 'u', username: 'name', member_role: 'admin', bot: false, joined_at: '2026-09-20T00:00:00Z', union_openid: 'union' };
const joinRequest = {
  join_request_id: 'r',
  member_openid: 'u',
  username: 'name',
  apply_at: 'date',
  verify_info: { method: 'admin_review_qa', review_qa_list: [{ question: 'q', answer: 'a' }] }
};
const policy = { strategy_id: 'ID', group_openids: ['ID'], is_enable: 'on', expire_at: 'date', whitelist_user_count: 1 };
const panel = {
  panel_id: 'ID',
  scope: 'group',
  target_type: 'specific',
  group_openids: ['ID'],
  panel: { items: [{ name: '/help', desc: 'help', type: 'command', only_admin: true }], remark: 'remark' },
  version: 7
};
const handlers = new Map();
const events = [];
const calls = [];
const routes = [];
const client = new QQBotAPI({ app_id: 'app' });
client.on = (name, fn) => handlers.set(name, fn);
client.groupService = async request => {
  calls.push(request);
  const path = request.url;
  if (path === '/gateway') return { url: 'wss://example.com' };
  if (path === '/users/@me')
    return {
      id: 'self',
      username: 'bot',
      avatar: 'official-avatar',
      union_openid: 'union',
      union_user_account: 'account',
      share_url: 'share',
      welcome_msg: 'hello'
    };
  if (path === '/users/@me' || path === '/users/me') return { id: 'self', username: 'bot' };
  if (path === '/v2/menu')
    return {
      version: 7,
      menu: {
        items: [
          { name: 'help', type: 'send_message', send_message: '/help' },
          { name: 'switch', type: 'switch', switch: { switch_id: 's', default: true } }
        ]
      }
    };
  if (path === '/v2/panels') return request.method === 'get' ? { records: [panel], next_cursor: 'next', is_end: false } : { panel_id: 'ID' };
  if (path === '/v2/panels/ID') return request.method === 'get' ? panel : { version: 8 };
  if (path === '/v2/generate_url_link') return { data: { url: 'https://example.com/share' } };
  if (path.endsWith('/info'))
    return { group_openid: 'ID', group_name: 'Group', group_finger_memo: 'memo', group_class_text: 'class', group_tags: ['tag'], group_member_num: 10 };
  if (path.endsWith('/bot_state')) return { member_openid: 'bot', member_role: 'admin', allow_proactive_msg: true, recv_msg_setting: 'all' };
  if (path.endsWith('/members')) return { members: [member], next_cursor: 'next' };
  if (path.includes('/members/')) return member;
  if (path.endsWith('/batch_remove_members')) return { remove_members_result: 'success', add_to_member_blacklist_fail_openids: [] };
  if (path.endsWith('/member_blacklist')) return { users: [{ ...member, banned_at: 'date' }], next_cursor: 'next', fail_openids: [] };
  if (path.endsWith('/restrict_chat_setting'))
    return {
      global_rule: { mode: 'schedule', recurring_rules: [{ task_id: 't', weekdays: [1], start_time: '08:00', end_time: '09:00', enabled: true }] },
      members: [{ ...member, mute_expire_at: 'date' }]
    };
  if (path.endsWith('/join_request_list')) return { list: [joinRequest], next_cursor: 'next' };
  if (path === '/v2/groups/join_approval_strategy') return request.method === 'get' ? { strategies: [policy], next_cursor: 'next' } : policy;
  if (path.endsWith('/whitelist_users')) return { strategy_id: 'ID', whitelist_user_count: 2, updated_at: 'updated' };
  if (path === '/v2/groups/join_approval_strategy/ID' && request.method === 'patch') return { is_enable: 'off', expire_at: 'expires' };
  if (path.endsWith('/files')) return { file_info: 'file', file_uuid: 'uuid', ttl: 60, raw_url: 'https://example.com/file' };
  if (path.endsWith('/upload_prepare'))
    return {
      upload_id: 'upload',
      block_size: '3',
      parts: [{ index: 0, presigned_url: 'https://example.com/part', block_size: '3' }],
      upload_config: { concurrency: 1, retry_timeout: 30, retry_delay: 2 }
    };
  if (path.endsWith('/messages') || path.endsWith('/stream_messages'))
    return { id: 'sent', timestamp: 'date', ext_info: { ref_idx: 'ref' }, remain_msg_len: 900 };
  return {};
};
const adapter = register(client, { botId: 'app', autoInteractionAck: false, cbp: { send: event => events.push(event), onactions() {}, onapis() {} } });
const envelopes = [];
setDirectSend(envelope => {
  envelopes.push(envelope);
  queueMicrotask(async () => {
    await adapter.onAction({ action: envelope.payload.action, payload: envelope.payload.input }, results => {
      clearTimeout(actionRequestTimeouts.get(envelope.id));
      actionRequestTimeouts.delete(envelope.id);
      actionRequestResolves.get(envelope.id)?.(results);
      actionRequestResolves.delete(envelope.id);
    });
  });
});
const check = async (hook, run) => {
  const before = calls.length;
  const result = await run();
  const item = Array.isArray(result) ? result[0] : result;
  assert.equal(item.code, ResultCode.Ok, `${hook}: ${JSON.stringify(item)}`);
  assert.equal(calls.length, before + 1, `${hook} should issue one HTTP request`);
  const req = calls.at(-1);
  const endpoint = `${(req.method ?? 'get').toUpperCase()} ${req.url}`;
  assert(expected.has(endpoint), `${hook}: ${endpoint} is not in official scope`);
  routes.push({ hook, action: envelopes.at(-1).payload.action, endpoint, source: expected.get(endpoint) });
  return item.data;
};
const [guild] = useGuild(group),
  [members] = useMember(group),
  [requests] = useRequest(group),
  [menu] = useMenu(group),
  [panels] = usePanel(group);
assert.equal((await check('useGuild.info', () => guild.info())).GuildName, 'Group');
assert.equal((await check('useGuild.botInfo', () => guild.botInfo())).allowsProactiveMessages, true);
assert.equal((await check('useGuild.muteState', () => guild.muteState())).global.recurring[0].id, 't');
assert.equal((await check('useMember.info', () => members.info({ userId: 'ID' }))).UserId, 'u');
assert.equal((await check('useMember.list', () => members.list({ pagination: { Cursor: 'cursor' } }))).NextCursor, 'next');
assert.equal(calls.at(-1).params.cursor, 'cursor');
assert.deepEqual((await check('useMember.kickMany', () => members.kickMany({ userIds: ['u'], blacklist: true }))).failedBlacklistIds, []);
assert.equal(calls.at(-1).data.add_to_member_blacklist, true);
await check('useMember.ban', () => members.ban({ userId: 'u' }));
assert.equal(calls.at(-1).data.add_to_member_blacklist, true);
assert.equal((await check('useMember.blacklist', () => members.blacklist({ pagination: { Limit: 5, Cursor: 'cursor' } }))).Items[0].userId, 'u');
await check('useMember.updateBlacklist', () => members.updateBlacklist({ operation: 'remove', userIds: ['u'] }));
assert.equal(calls.at(-1).data.op, 'del');
await check('useMember.muteMany', () => members.muteMany({ members: [{ userId: 'u', operation: 'update', expiresAt: 'date' }] }));
assert.equal(calls.at(-1).data.members[0].mute_expire_at, 'date');
assert.equal((await check('useRequest.list', () => requests.list())).Items[0].verification.questions[0].answer, 'a');
await check('useRequest.decide', () => requests.decide({ userId: 'ID', requestId: 'r', approve: false, reason: 'reason', blacklist: true }));
assert.deepEqual(calls.at(-1).data, { op: 'decline', join_request_id: 'r', reject_reason: 'reason', add_to_member_blacklist: true });
assert.equal((await check('useRequest.policies.list', () => requests.policies.list())).Items[0].enabled, true);
await check('useRequest.policies.create', () => requests.policies.create({ enabled: true, guildIds: ['ID'], expiresAt: 'date', remark: 'r' }));
assert.equal(calls.at(-1).data.is_enable, 'on');
assert.deepEqual(
  await check('useRequest.policies.update', () => requests.policies.update({ id: 'ID', enabled: false, guilds: { operation: 'remove', ids: ['ID'] } })),
  { enabled: false, expiresAt: 'expires' }
);
assert.equal(calls.at(-1).data.group_action.op, 'del');
await check('useRequest.policies.delete', () => requests.policies.delete('ID'));
await check('useRequest.policies.execute', () => requests.policies.execute('ID'));
assert.deepEqual(await check('useRequest.policies.updateWhitelist', () => requests.policies.updateWhitelist({ id: 'ID', operation: 'add', userIds: ['u'] })), {
  id: 'ID',
  whitelistCount: 2,
  updatedAt: 'updated'
});
assert.equal((await check('useMenu.get', () => menu.get())).menu.items[0].text, '/help');
await check('useMenu.set', () =>
  menu.set({
    items: [
      { type: 'menu', name: 'more', items: [{ type: 'message', name: 'help', text: '/help' }] },
      { type: 'switch', name: 'search', id: 's', default: true }
    ]
  })
);
assert.equal(calls.at(-1).data.menu.items[0].sub_menu_items[0].send_message, '/help');
assert.equal((await check('usePanel.list', () => panels.list({ scope: 'group', pagination: { Limit: 5 } }))).Items[0].panel.items[0].adminOnly, true);
await check('usePanel.create', () =>
  panels.create({ scope: 'group', audience: 'specific', guildIds: ['g'], panel: { items: [{ type: 'command', name: 'help', adminOnly: true }] } })
);
assert.equal(calls.at(-1).data.panel.items[0].only_admin, true);
await check('usePanel.get', () => panels.get('ID'));
await check('usePanel.update', () => panels.update({ id: 'ID', panel: { items: [], version: 7 } }));
await check('usePanel.delete', () => panels.delete('ID'));
await check('usePanel.updateTargets', () => panels.updateTargets({ id: 'ID', operation: 'add', userIds: ['u'], guildIds: ['g'] }));
assert.equal((await check('useMe.share', () => useMe(group)[0].share({ data: 'campaign' }))).url, 'https://example.com/share');
await check('useMe.info', () => useMe(group)[0].info());
await check('useConnection.gateway', () => useConnection(group)[0].gateway());
for (const context of [group, c2c]) {
  const [message] = useMessage(context),
    [media] = useMedia(context);
  await check('useMessage.send', () =>
    message.send({
      content: {
        markdown: { content: '# hi', verifyImages: true },
        keyboard: {
          rows: [
            [
              {
                id: 'b',
                label: 'Go',
                groupId: 'g',
                action: { type: 'callback', data: 'click', permission: { type: 'users', userIds: ['u'] }, modal: { content: 'confirm' } }
              }
            ]
          ]
        }
      },
      eventId: 'event',
      referenceId: 'ref',
      sequence: 3
    })
  );
  assert.equal(calls.at(-1).data.event_id, 'event');
  assert.equal(calls.at(-1).data.msg_id, undefined);
  assert.equal(calls.at(-1).data.markdown.force_verify_image_resource, true);
  assert.equal(calls.at(-1).data.keyboard.content.rows[0].buttons[0].action.permission.specify_user_ids[0], 'u');
  await check('useMessage.delete', () => message.delete({ messageId: 'ID' }));
  await check('useMedia.upload', () => media.upload({ type: 'image', url: 'https://example.com/image.png' }));
  const prepared = await check('useMedia.prepare', () =>
    media.prepare({ type: 'image', name: 'a.png', size: '3', hashes: { md5: 'md5', sha1: 'sha1', headMd5: 'head' } })
  );
  assert.equal(prepared.parts[0].url, 'https://example.com/part');
  assert.equal(calls.at(-1).data.md5_10m, 'head');
  await check('useMedia.finishPart', () => media.finishPart({ uploadId: 'upload', index: 0, size: '3', md5: 'md5' }));
  assert.equal(calls.at(-1).data.part_index, 0);
  await check('useMedia.complete', () => media.complete({ uploadId: 'upload', type: 'image', name: 'a.png', send: true }));
  assert.equal(calls.at(-1).data.srv_send_msg, true);
}
await check('useMessage.send(format)', () =>
  useMessage({ ...group, _tag: 'GROUP_AT_MESSAGE_CREATE', MessageId: 'original' })[0].send({
    format: [{ type: 'Text', value: 'reply' }],
    replyId: 'override',
    referenceId: 'reference',
    sequence: 5
  })
);
assert.equal(calls.at(-1).data.msg_id, 'override');
assert.equal(calls.at(-1).data.msg_seq, 5);
assert.equal(calls.at(-1).data.message_reference.message_id, 'reference');
await check('useMessage.send(event reply)', () =>
  useMessage({ ...group, _tag: 'GROUP_ADD_ROBOT', MessageId: 'event' })[0].send({ format: [{ type: 'Text', value: 'welcome' }] })
);
assert.equal(calls.at(-1).data.event_id, 'event');
assert.equal(calls.at(-1).data.msg_id, undefined);
await check('useMessage.typing', () => useMessage(c2c)[0].typing({ duration: 20 }));
assert.equal(calls.at(-1).data.input_notify.input_second, 20);
assert.equal(
  (
    await check('useMessage.stream', () =>
      useMessage(c2c)[0].stream({
        text: 'hello',
        mode: 'replace',
        state: 'complete',
        contentType: 'markdown',
        index: 2,
        streamId: 's',
        replyId: 'r',
        sequence: 4
      })
    )
  ).remainingLength,
  900
);
assert.equal(calls.at(-1).data.stream_msg_id, 's');
assert.equal(calls.at(-1).data.input_state, 10);
await check('useInteraction.ack', () => useInteraction({ ...c2c, name: 'private.interaction.create', InteractionId: 'ID' })[0].ack({ code: 1 }));
const covered = new Set(routes.map(item => item.endpoint));
assert.deepEqual(
  [...expected.keys()].filter(key => !covered.has(key)),
  [],
  'Every official endpoint must be reachable through framework hooks'
);
assert(
  envelopes.every(e => !e.payload.action.startsWith('qq-bot.')),
  'No platform-specific action escape hatch'
);

const mediaCalls = calls.length;
await useMedia(group)[0].sendUser({ userId: 'other', type: 'image', url: 'https://example.com/other.png', replyId: 'reply' });
assert.equal(calls.length, mediaCalls + 2);
assert.equal(calls.at(-2).url, '/v2/users/other/files');
assert.equal(calls.at(-1).url, '/v2/users/other/messages');
assert.equal(calls.at(-1).data.msg_id, 'reply');

// Aliases must upload and send to the same explicit recipient and bot.
const aliasStart = calls.length;
assert.equal(
  (
    await useMedia({ ...group, BotId: 'wrong', Target: { ...group.Target, BotId: 'wrong' } })[0].sendUser({
      type: 'image',
      userId: 'recipient',
      BotId: 'app',
      url: 'https://example.com/alias.png'
    })
  ).code,
  ResultCode.Ok
);
assert.equal(calls[aliasStart].url, '/v2/users/recipient/files');
assert.equal(calls[aliasStart + 1].url, '/v2/users/recipient/messages');
const noMediaRequest = calls.length;
assert.equal((await useMedia(group)[0].upload({ type: 'image', fileId: 'f', replyId: 'r' })).code, ResultCode.FailParams);
assert.equal(
  (await useMedia(group)[0].sendUser({ type: 'image', userId: 'recipient', target: { scope: 'c2c', targetId: 'different' }, fileId: 'f' })).code,
  ResultCode.FailParams
);
assert.equal((await useMedia(group)[0].sendUser({ type: 'image', userId: 'recipient', fileId: '' })).code, ResultCode.FailParams);
assert.equal(calls.length, noMediaRequest);
assert.equal((await useMedia(group)[0].send({ type: 'image', fileId: 'existing' })).code, ResultCode.Ok);
assert.equal(calls.at(-1).url, '/v2/groups/ID/messages');
const media = useMedia(group)[0];
const initialUpload = await media.upload({ type: 'file', url: 'https://example.com/cache', name: 'first.txt' });
const cacheBefore = calls.length;
const cachedUpload = await media.upload({ type: 'file', url: 'https://example.com/cache', name: 'first.txt' });
assert.equal(calls.length, cacheBefore);
assert.equal(cachedUpload.data.reused, true);
assert.equal(cachedUpload.data.uuid, initialUpload.data.uuid);
assert.equal(cachedUpload.data.ttl, initialUpload.data.ttl);
assert.equal(cachedUpload.data.url, initialUpload.data.url);
await media.upload({ type: 'file', url: 'https://example.com/cache', name: 'second.txt' });
assert.equal(calls.length, cacheBefore + 1, 'A filename change must not reuse an upload with a different name');
assert.equal(calls.at(-1).data.file_name, 'second.txt');

// Unsupported scopes and ambiguous IDs must never reach a channel HTTP endpoint.
const guardedAt = calls.length;
for (const run of [
  () => requests.policies.create({ guildIds: ['g'], guildNumbers: ['123'] }),
  () => requests.policies.create({}),
  () => requests.policies.create({ guildIds: [] }),
  () => requests.policies.update({ id: 'ID', guilds: { operation: 'add', ids: ['g'], numbers: ['123'] } }),
  () => requests.policies.updateWhitelist({ id: 'ID', operation: 'add', userIds: [] }),
  () => requests.policies.updateWhitelist({ id: 'ID', operation: 'add', userIds: Array(10001).fill('u') }),
  () => menu.set({ items: Array(11).fill({ type: 'message', name: 'help', text: '/help' }) }),
  () => menu.set({ items: [{ type: 'link', name: 'help', url: 'http://example.com' }] }),
  () => panels.create({ scope: 'group', audience: 'specific', userIds: ['u'], panel: { items: [] } }),
  () => panels.create({ scope: 'group', panel: { items: Array(21).fill({ type: 'command', name: 'help' }) } }),
  () => panels.updateTargets({ id: 'ID', operation: 'add' }),
  () => members.muteMany({ members: [] }),
  () => members.muteMany({ members: Array(21).fill({ userId: 'u', operation: 'add' }) }),
  () => useMessage(c2c)[0].typing({ duration: 61 }),
  () => useMessage(c2c)[0].stream({ text: '', index: 0 }),
  () => useMessage(c2c)[0].stream({ text: 'x', index: -1 }),
  () => useMe(group)[0].guilds(),
  () => guild.list(),
  () => guild.update({ name: 'unsupported' }),
  () => useGuild({ BotId: 'app', GuildId: 'ID' })[0].info(),
  () => useMember({ BotId: 'app', GuildId: 'ID' })[0].info({ userId: 'u' }),
  () => useGuild(c2c)[0].botInfo({ guildId: 'ID' }),
  () => useMessage({ ...group, MessageId: 'm' })[0].get(),
  () => useMessage({ ...group, MessageId: 'm' })[0].unpin(),
  () => useMessage({ ...group, MessageId: 'm' })[0].edit({ format: [{ type: 'Text', value: 'edit' }] }),
  () => useMe({ BotId: 'wrong' })[0].info(),
  () => useInteraction({ ...c2c, BotId: 'wrong', Target: { ...c2c.Target, BotId: 'wrong' }, InteractionId: 'ID' })[0].ack(),
  async () => (await useMessage(group)[0].send({ content: { text: 'x' }, wakeup: true }))[0],
  async () => (await useMessage(group)[0].send({ content: { markdown: { content: 'x' }, media: { fileId: 'f' } } }))[0],
  async () => (await useMessage(group)[0].send({ content: { text: 'x', keyboard: { templateId: 't', rows: [] } } }))[0],
  () => members.kickMany({ userIds: [] }),
  () => members.updateBlacklist({ operation: 'add', userIds: Array(21).fill('u') })
]) {
  const result = await run();
  assert.notEqual(result.code, ResultCode.Ok, JSON.stringify(result));
}
assert.equal(calls.length, guardedAt, 'Rejected operations must issue no HTTP requests');
// A standard Target alone is sufficient; no duplicated GuildId/ChannelId is required.
assert.equal((await requests.decide({ userId: 'u', approve: true })).code, ResultCode.Ok);
assert.equal(calls.at(-1).data.join_request_id, undefined, 'Optional official request ID must remain optional');
const targetOnly = { Platform: 'qq-bot', Target: group.Target };
assert.equal((await useGuild(targetOnly)[0].info()).code, ResultCode.Ok);
assert.equal(calls.at(-1).url, '/v2/groups/ID/info');
assert.equal((await useMember(targetOnly)[0].list()).code, ResultCode.Ok);
assert.equal(calls.at(-1).url, '/v2/groups/ID/members');
const panelService = client.groupService;
client.groupService = async request =>
  request.url === '/v2/panels/channel-panel' ? { ...panel, panel_id: 'channel-panel', scope: 'channel' } : panelService(request);
const channelPanel = await panels.get('channel-panel');
assert.equal(channelPanel.code, ResultCode.Fail);
client.groupService = panelService;
await useMessage({ ...group, _tag: 'GROUP_AT_MESSAGE_CREATE', MessageId: 'original' })[0].send({
  target: { scope: 'group', targetId: 'other' },
  content: { text: 'cross-group' }
});
assert.equal(calls.at(-1).url, '/v2/groups/other/messages');
assert.equal(calls.at(-1).data.msg_id, undefined, 'A different conversation cannot inherit the origin reply ID');
const traceEvent = { ...group, _tag: 'GROUP_AT_MESSAGE_CREATE', MessageId: 'trace' };
await useMessage(traceEvent)[0].send({ content: { text: 'track sending' } });
assert.equal(traceEvent._sendAttempted, true);
assert.equal(traceEvent._sendSucceeded, true);
assert.equal((await useInteraction({ BotId: 'app' })[0].ack({ InteractionId: 'delayed', target: c2c.Target })).code, ResultCode.Ok);
assert.equal(calls.at(-1).url, '/interactions/delayed');
let ackCount = 0;
await adapter.onAction({ action: 'interaction.ack', payload: { target: c2c.Target, InteractionId: 'once', params: { code: 0 } } }, () => ackCount++);
assert.equal(ackCount, 1, 'An interaction must be consumed exactly once');
// HTTP success with per-member failures is a warning, retaining semantic failure details.
const service = client.groupService;
client.groupService = async () => ({ remove_members_result: 'success', add_to_member_blacklist_fail_openids: ['u'] });
const partial = await members.kickMany({ userIds: ['u'], blacklist: true });
assert.equal(partial.code, ResultCode.Warn);
assert.deepEqual(partial.data.failedBlacklistIds, ['u']);
assert.equal((await members.ban({ userId: 'u' })).code, ResultCode.Warn);
client.groupService = async () => ({ fail_openids: ['u'] });
const failedUnban = await members.unban({ userId: 'u' });
assert.equal(failedUnban.code, ResultCode.Warn);
assert.deepEqual(failedUnban.data.failedUserIds, ['u']);
assert.equal((await members.updateBlacklist({ operation: 'remove', userIds: ['u'] })).code, ResultCode.Warn);
client.groupService = service;

const profile = await useMe(group)[0].info();
assert.equal(profile.data.UserAvatar, 'official-avatar');
assert.equal(profile.data.UnionId, 'union');
assert.equal(profile.data.AccountId, 'account');
assert.equal(profile.data.ShareUrl, 'share');
assert.equal(profile.data.WelcomeMessage, 'hello');
await useMessage({
  ...group,
  BotId: 'old-bot',
  Target: { ...group.Target, BotId: 'old-bot' },
  _tag: 'GROUP_AT_MESSAGE_CREATE',
  MessageId: 'old-message'
})[0].send({
  target: group.Target,
  content: { text: 'switch bot' }
});
assert.equal(calls.at(-1).data.msg_id, undefined, 'Switching bots cannot inherit a reply ID even in the same group');
// Errors and bot ownership must survive the framework, not become success/warning.
const before = calls.length;
assert.equal((await useMenu({ BotId: 'wrong' })[0].get()).code, ResultCode.FailParams);
assert.equal((await useMessage(group)[0].stream({ text: 'not supported' })).code, ResultCode.Fail);
assert.equal((await useMessage(c2c)[0].send({ content: { text: 'x' }, wakeup: true, replyId: 'r' }))[0].code, ResultCode.Fail);
assert.equal(calls.length, before);
client.groupService = async () => {
  throw { response: { data: { code: 11253, message: 'permission denied' } } };
};
assert.deepEqual((await menu.get()).data, { code: 11253, message: 'permission denied' });
assert.deepEqual((await members.list()).data, { code: 11253, message: 'permission denied' });
assert.deepEqual((await useInteraction({ ...c2c, InteractionId: 'denied' })[0].ack()).data, { code: 11253, message: 'permission denied' });
assert.deepEqual((await useMe(group)[0].info()).data, { code: 11253, message: 'permission denied' });

// The application can consume all event data through standard framework fields.
const fixtures = reference.events;
for (const [name, samples] of Object.entries(fixtures)) for (const sample of samples) await handlers.get(name)(sample);
const subscription = events.find(e => e.Notice?.type === 'subscription');
assert(subscription.Notice.subscriptions[0].subscriptionId);
assert(events.some(e => e.Notice?.type === 'join-request' && e.Notice.request.id));
assert(events.some(e => e.FriendSource?.data));
assert(events.some(e => e.Interaction?.type === 'authorization' && e.Interaction.authorization.scope));
assert(events.some(e => e.MessageContent?.card));
assert(events.some(e => e.MessageContent?.elements));
await handlers.get('C2C_MESSAGE_CREATE')({
  id: 'm',
  author: { id: 'u' },
  content: '',
  attachments: [{ content_type: 'voice', url: 'audio', voice_wav_url: 'wav', asr_refer_text: 'hello' }],
  message_scene: { ext: ['msg_idx=REF==', 'ref_msg_idx=OTHER=='] }
});
assert.equal(events.at(-1).MessageMedia[0].Transcript, 'hello');
assert.equal(events.at(-1).MessageContent.referenceId, 'REF==');
await handlers.get('INTERACTION_CREATE')({ id: 'clear', scene: 'c2c', user_openid: 'u', type: 14, data: {} });
assert.equal(events.at(-1).Interaction.type, 'clear-session');
assert.equal(events.at(-1).Interaction.requiresAck, false);
const fullAuthor = {
  id: 'source',
  user_openid: 'direct',
  member_openid: 'member',
  username: 'name',
  bot: true,
  union_openid: 'union',
  union_user_account: 'account',
  member_role: 'admin'
};
await handlers.get('GROUP_MESSAGE_CREATE')({
  id: 'full',
  group_openid: 'g',
  author: { ...fullAuthor, bot: false },
  content: '',
  mentions: [fullAuthor],
  msg_elements: [{ author: fullAuthor, msg_idx: 'ref', msg_elements: [{ author: fullAuthor }] }]
});
const full = events.at(-1);
assert.equal(full.IsBot, false);
assert.equal(full.MessageContent.elements[0].author.IsBot, true);
assert.equal(full.DirectUserId, 'direct');
assert.equal(full.MemberId, 'member');
assert.equal(full.MessageContent.elements[0].author.AccountId, 'account');
assert.equal(full.MessageContent.elements[0].content.elements[0].author.Role, 'admin');
const beforeMention = envelopes.length;
const mentioned = await useMention(full)[0].find({ IsBot: true });
assert.equal(mentioned.data[0].UserId, 'member');
assert.equal(mentioned.data[0].SourceUserId, 'source');
assert.equal(mentioned.data[0].UnionId, 'union');
assert.equal(envelopes.length, beforeMention, 'Standard mentions should not require an adapter round trip');
await handlers.get('GROUP_MEMBER_ADD')({ group_openid: 'g', member_openid: 'm', user_openid: 'u', timestamp: 123 });
assert.equal(events.at(-1).MemberId, 'm');
assert.equal(events.at(-1).DirectUserId, 'u');
if (process.env.QQ_BOT_WRITE_COVERAGE === '1') writeFileSync(new URL('framework-coverage.json', root), JSON.stringify(routes, null, 2) + '\n');
setDirectSend(null);
console.log(`Framework hooks verified against all ${covered.size} official API endpoints; standardized event data, errors, scope and bot routing verified.`);
process.exit(0);
