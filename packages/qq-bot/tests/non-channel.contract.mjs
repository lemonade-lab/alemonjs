import { existsSync, readFileSync as readConfig, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { QQBotAPI } from '../lib/sdk/api.js';
import { register } from '../lib/register.js';

const configPath = resolve('alemon.config.yaml');
const hadConfig = existsSync(configPath);
process.on('exit', () => {
  if (!hadConfig && existsSync(configPath) && readConfig(configPath, 'utf8').trim() === '{}') rmSync(configPath);
});

const root = new URL('../docs/official/non-channel/', import.meta.url);
const reference = JSON.parse(readFileSync(new URL('./fixtures/non-channel.json', import.meta.url)));
const included = reference.catalog.filter(item => item.scope === 'included');
const coveredSources = new Set(reference.api.map(item => item.source));
for (const name of Object.keys(reference.events)) {
  coveredSources.add(`https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/${name.toLowerCase()}.html`);
}
assert.equal(new Set(reference.catalog.map(item => item.source)).size, reference.catalog.length);
assert.deepEqual(included.map(item => item.source).sort(), [...coveredSources].sort(), 'Every included sitemap reference must have a contract fixture');
for (const item of reference.catalog.filter(item => item.scope !== 'included')) {
  assert.equal(item.scope, 'channel');
  assert.match(item.source, /\/autogen\/(api\/(channels_|guilds_|users_me_guilds\.)|event\/(channel_|guild_))/);
}
console.log(
  `Audited ${reference.catalog.length} generated references: ${included.length} in scope, ${
    reference.catalog.length - included.length
  } channel references excluded.`
);
const calls = [];
const coverage = [];
const sdk = new QQBotAPI({ app_id: 'test' });
sdk.groupService = async request => {
  calls.push(request);
  return { id: 'sent', file_info: 'file' };
};
const id = 'ID';
const body = { msg_type: 0, content: 'text', msg_id: 'reply', msg_seq: 3 };
const cases = {
  gateway: [],
  usersMe: [],
  usersOpenMessages: [id, body],
  groupOpenMessages: [id, body],
  userMessageDelete: [id, id],
  groupMessageDelete: [id, id],
  postRichMediaByUser: [id, { file_type: 1, url: 'https://example.com/image.png', srv_send_msg: false }],
  postRichMediaByGroup: [id, { file_type: 1, upload_id: 'upload', srv_send_msg: false }],
  usersUploadPrepare: [id, { file_type: 1, file_name: 'a.png', file_size: '3', md5: 'md5', sha1: 'sha1', md5_10m: 'md5' }],
  groupUploadPrepare: [id, { file_type: 1, file_name: 'a.png', file_size: '3', md5: 'md5', sha1: 'sha1', md5_10m: 'md5' }],
  usersUploadPartFinish: [id, { upload_id: 'upload', part_index: 0, block_size: '3', md5: 'md5' }],
  groupUploadPartFinish: [id, { upload_id: 'upload', part_index: 0, block_size: '3', md5: 'md5' }],
  streamMessages: [id, { input_mode: 'replace', input_state: 10, content_raw: 'done', index: 0 }],
  groupsInfo: [id],
  groupsBotState: [id],
  groupsMembers: [id, { cursor: 'cursor' }],
  groupsMembersMessage: [id, id],
  groupsBatchRemoveMembers: [id, { member_openids: ['member'], add_to_member_blacklist: true }],
  groupsMemberBlacklist: [id, { cursor: 'cursor', limit: 20 }],
  groupsMemberBlacklistPost: [id, { op: 'del', member_openids: ['member'] }],
  groupsJoinRequestList: [id, { cursor: 'cursor', limit: 20 }],
  groupsApprovalJoinRequest: [id, id, { op: 'approve', join_request_id: 'request' }],
  groupsRestrictChatSetting: [id],
  groupsRestrictChatSettingPost: [id, { members: [{ op: 'del', member_openid: 'member' }] }],
  groupsJoinApprovalStrategies: [{ cursor: 'cursor', limit: 20 }],
  groupsJoinApprovalStrategyCreate: [{ group_openids: ['group'], is_enable: 'on' }],
  groupsJoinApprovalStrategyPatch: [id, { is_enable: 'off' }],
  groupsJoinApprovalStrategyDelete: [id],
  groupsJoinApprovalStrategyExecute: [id],
  groupsJoinApprovalStrategyWhitelistUsers: [id, { op: 'add', whitelist_users: ['user'] }],
  generateUrlLink: [{ callback_data: 'campaign' }],
  menuGet: [],
  menuPut: [{ menu: { items: [{ type: 'send_message', name: '帮助', send_message: '/help' }] } }],
  panelsList: [{ scope: 'group', cursor: 'cursor', limit: 10 }],
  panelsCreate: [{ scope: 'group', target_type: 'specific', group_openids: ['group'], panel: { items: [] } }],
  panelsGet: [id],
  panelsPut: [id, { panel: { items: [], remark: 'test' } }],
  panelsDelete: [id],
  panelsTargetPut: [id, { op: 'del', group_openids: ['group'] }],
  interactionResponse: ['group', id, 0]
};

// Compare actual SDK requests against independently downloaded official endpoint definitions.
const expected = new Map(reference.api.map(item => [item.endpoint.replace(/\{[^}]+\}/g, 'ID'), item.source]));
const handlers = new Map();
const emitted = [];
sdk.on = (name, fn) => handlers.set(name, fn);
const adapter = register(sdk, { botId: 'test', cbp: { send: event => emitted.push(event), onactions() {}, onapis() {} } });
for (const [method, args] of Object.entries(cases)) {
  await sdk[method](...args);
  const request = calls.at(-1);
  const key = `${(request.method || 'get').toUpperCase()} ${request.url}`;
  assert(expected.has(key), `${method}: undocumented or duplicate endpoint ${key}`);
  coverage.push({ method, endpoint: key, source: expected.get(key) });
  expected.delete(key);
  const options = args.at(-1);
  if (options && typeof options === 'object') {
    const sent = request.method === 'get' ? request.params : request.data;
    for (const [key, value] of Object.entries(options)) assert.deepEqual(sent[key], value, `${method} lost ${key}`);
  }
}
assert.equal(expected.size, 0, `Missing endpoints: ${[...expected.keys()].join(', ')}`);
// Exercise every official non-channel event example through the adapter.
const fixtures = reference.events;
let ackCount = 0;
sdk.interactionResponse = async () => {
  ackCount++;
};
let fixtureCount = 0;
for (const [name, samples] of Object.entries(fixtures)) {
  assert(handlers.has(name), `Unregistered official event: ${name}`);
  assert(samples.length > 0, `${name} has no official fixture`);
  for (const sample of samples) {
    const before = emitted.length;
    await handlers.get(name)(sample);
    assert.equal(emitted.length, before + 1, `${name} should reach AlemonJS`);
    assert.deepEqual(emitted.at(-1).value, sample, `${name} must retain all raw data`);
    fixtureCount++;
  }
}
assert.equal(ackCount, 2, 'Only button/menu interactions need ACK');
await handlers.get('SUBSCRIBE_MESSAGE_STATUS')({ group_openid: 'group', result: [] });
assert.equal(emitted.at(-1).name, 'notice.create');
assert.equal(emitted.at(-1).ChannelId, 'group');
await handlers.get('GROUP_MEMBER_REMOVE')({ group_openid: 'g', member_openid: 'removed', op_member_openid: 'admin' });
assert.equal(emitted.at(-1).UserId, 'removed');
await handlers.get('GROUP_MESSAGE_CREATE')({
  id: 'msg',
  group_openid: 'OPENID',
  group_id: 'number',
  author: { id: 'legacy', member_openid: 'member' },
  content: '',
  attachments: [{ url: 'https://example.com/a', content_type: 'voice' }]
});
assert.equal(emitted.at(-1).ChannelId, 'OPENID');
assert.equal(emitted.at(-1).UserId, 'member');
assert.equal(emitted.at(-1).MessageMedia[0].Type, 'audio');
await handlers.get('INTERACTION_CREATE')({
  scene: 'c2c',
  user_openid: 'u',
  id: 'interaction',
  event_id: 'envelope',
  type: 12,
  data: { resolved: { feature_id: 'help' } }
});
assert.equal(emitted.at(-1).MessageId, 'envelope');
assert.equal(emitted.at(-1).InteractionId, 'interaction');
for (const type of [13, 14, 15, 16, 18, 19, 20]) {
  const count = ackCount;
  await handlers.get('INTERACTION_CREATE')({ scene: 'c2c', user_openid: 'u', id: 'interaction', type, data: { resolved: { action: 'example' } } });
  assert.equal(ackCount, count);
}
// Native Markdown must not send a competing content field; verification is nested.
const { GROUP_AT_MESSAGE_CREATE } = await import('../lib/sends.js');
let markdownRequest;
await GROUP_AT_MESSAGE_CREATE(
  {
    groupOpenMessages: async (_id, data) => {
      markdownRequest = data;
      return { id: 'md' };
    }
  },
  { ChannelId: 'group', MessageId: 'msg' },
  [
    { type: 'Text', value: 'prefix' },
    { type: 'Markdown', value: [{ type: 'Text', value: 'body' }] }
  ],
  { forceVerifyImageResource: true }
);
assert.equal(markdownRequest.content, undefined);
assert.equal(markdownRequest.markdown.force_verify_image_resource, true);
assert.equal(markdownRequest.force_verify_image_resource, undefined);
const manualHandlers = new Map();
register(
  {
    on: (name, fn) => manualHandlers.set(name, fn),
    interactionResponse: async () => {
      throw new Error('Must not auto ACK');
    }
  },
  { botId: 'test', autoInteractionAck: false, cbp: { send() {}, onactions() {}, onapis() {} } }
);
await manualHandlers.get('INTERACTION_CREATE')({ scene: 'c2c', user_openid: 'u', id: 'i', type: 11, data: { resolved: {} } });
if (process.env.QQ_BOT_WRITE_COVERAGE === '1') writeFileSync(new URL('api-coverage.json', root), JSON.stringify(coverage, null, 2) + '\n');
console.log(
  `Verified ${Object.keys(cases).length} official SDK API routes; ${
    Object.keys(fixtures).length
  } events / ${fixtureCount} official examples; IDs, media, ACKs and errors.`
);
process.exit(0);
