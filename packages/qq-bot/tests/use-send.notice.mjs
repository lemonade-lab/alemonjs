/**
 * use.send 路由验证：
 * - 平台支持事件回复的 notice 事件（GROUP_ADD_ROBOT / GROUP_MSG_RECEIVE / C2C_MSG_RECEIVE / FRIEND_ADD）
 *   应携带 event_id 走被动回复链路，且不携带 msg_id；
 * - 其余 notice / member 事件降级为主动消息（无 msg_id / event_id）；
 * - 未覆盖 tag 返回显式 Fail 而非空数组；消息与互动事件的既有行为保持不变。
 *
 * 运行：yarn workspace @alemonjs/qq-bot build && node tests/use-send.notice.mjs
 */
import assert from 'node:assert/strict';

const { register } = await import('../lib/register.js');

const OK = 2000;
const FAIL = 4000;

/** 记录发送调用：{ kind, targetId, data, wire }，wire 为 JSON 序列化后的线上格式 */
const calls = [];
const client = {
  on: () => {},
  groupOpenMessages: async (channelId, data) => {
    calls.push({ kind: 'group', targetId: channelId, data, wire: JSON.parse(JSON.stringify(data)) });
    return { id: `msg_group_${calls.length}` };
  },
  usersOpenMessages: async (userId, data) => {
    calls.push({ kind: 'c2c', targetId: userId, data, wire: JSON.parse(JSON.stringify(data)) });
    return { id: `msg_c2c_${calls.length}` };
  }
};

const registration = register(client, {
  botId: 'test-bot',
  cbp: { send: () => {}, onactions: () => {}, onapis: () => {} }
});

/** 调用 message.send 并等待适配器消费结果 */
const send = event =>
  new Promise(resolve => {
    void registration.onAction({ action: 'message.send', payload: { event, params: { format: [{ type: 'Text', value: 'notice 通知' }] } } }, resolve);
  });

const lastCall = () => calls[calls.length - 1];

// ── 事件回复链路（event_id）──

// 1. 机器人进群：群聊事件回复，event_id 由信封 payload.id 回填
{
  const results = await send({ _tag: 'GROUP_ADD_ROBOT', ChannelId: 'GROUP_OPENID_A', MessageId: 'EVT_GROUP_ADD' });
  assert.equal(results[0].code, OK, `GROUP_ADD_ROBOT 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'group');
  assert.equal(lastCall().targetId, 'GROUP_OPENID_A');
  assert.equal(lastCall().wire.event_id, 'EVT_GROUP_ADD', '事件回复应携带 event_id');
  assert.equal(lastCall().wire.msg_id, undefined, '事件回复不应携带 msg_id');
}

// 2. 群消息推送开启：群聊事件回复
{
  const results = await send({ _tag: 'GROUP_MSG_RECEIVE', ChannelId: 'GROUP_OPENID_B', MessageId: 'EVT_MSG_RECEIVE' });
  assert.equal(results[0].code, OK, `GROUP_MSG_RECEIVE 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'group');
  assert.equal(lastCall().wire.event_id, 'EVT_MSG_RECEIVE');
  assert.equal(lastCall().wire.msg_id, undefined);
}

// 3. C2C 消息推送开启：单聊事件回复
{
  const results = await send({ _tag: 'C2C_MSG_RECEIVE', UserId: 'USER_OPENID_A', MessageId: 'EVT_C2C_RECEIVE' });
  assert.equal(results[0].code, OK, `C2C_MSG_RECEIVE 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'c2c');
  assert.equal(lastCall().targetId, 'USER_OPENID_A');
  assert.equal(lastCall().wire.event_id, 'EVT_C2C_RECEIVE');
  assert.equal(lastCall().wire.msg_id, undefined);
}

// 4. 好友添加：单聊事件回复
{
  const results = await send({ _tag: 'FRIEND_ADD', UserId: 'USER_OPENID_B', MessageId: 'EVT_FRIEND_ADD' });
  assert.equal(results[0].code, OK, `FRIEND_ADD 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'c2c');
  assert.equal(lastCall().wire.event_id, 'EVT_FRIEND_ADD');
  assert.equal(lastCall().wire.msg_id, undefined);
}

// 5. 互动事件：既有 event_id 链路保持不变
{
  const results = await send({ _tag: 'INTERACTION_CREATE_GROUP', ChannelId: 'GROUP_OPENID_C', MessageId: 'EVT_INTERACTION' });
  assert.equal(results[0].code, OK, `INTERACTION_CREATE_GROUP 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().wire.event_id, 'EVT_INTERACTION');
  assert.equal(lastCall().wire.msg_id, undefined);
}

// ── 主动消息降级（平台不支持事件回复的 notice 事件）──

// 6. 入群申请（合成 MessageId 不得透传）：主动消息，无 msg_id / event_id
{
  const results = await send({
    _tag: 'GROUP_JOIN_REQUEST',
    ChannelId: 'GROUP_OPENID_D',
    UserId: 'MEMBER_OPENID_D',
    MessageId: 'group_join_request_GROUP_OPENID_D_123'
  });
  assert.equal(results[0].code, OK, `GROUP_JOIN_REQUEST 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'group');
  assert.equal(lastCall().targetId, 'GROUP_OPENID_D');
  assert.equal(lastCall().wire.msg_id, undefined, '主动消息请求体不应包含 msg_id');
  assert.equal(lastCall().wire.event_id, undefined, '主动消息请求体不应包含 event_id');
  assert.equal(lastCall().wire.content, 'notice 通知');
}

// 7. 成员进群：主动消息
{
  const results = await send({ _tag: 'GROUP_MEMBER_ADD', ChannelId: 'GROUP_OPENID_E', UserId: 'MEMBER_OPENID_E' });
  assert.equal(results[0].code, OK, `GROUP_MEMBER_ADD 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'group');
  assert.equal(lastCall().targetId, 'GROUP_OPENID_E');
  assert.equal(lastCall().wire.msg_id, undefined);
  assert.equal(lastCall().wire.event_id, undefined);
}

// 8. 审核结果：主动消息
{
  const results = await send({ _tag: 'MESSAGE_AUDIT_PASS', ChannelId: 'GROUP_OPENID_F' });
  assert.equal(results[0].code, OK, `MESSAGE_AUDIT_PASS 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'group');
  assert.equal(lastCall().targetId, 'GROUP_OPENID_F');
}

// 9. C2C 消息推送开启但缺失 event_id：降级为主动消息
{
  const results = await send({ _tag: 'C2C_MSG_RECEIVE', UserId: 'USER_OPENID_C' });
  assert.equal(results[0].code, OK, `C2C_MSG_RECEIVE 缺失 event_id 时应降级为主动消息，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().kind, 'c2c');
  assert.equal(lastCall().targetId, 'USER_OPENID_C');
  assert.equal(lastCall().wire.msg_id, undefined);
  assert.equal(lastCall().wire.event_id, undefined);
}

// ── 既有行为 ──

// 10. 未覆盖的 tag（频道成员事件，无路由目标）：显式 Fail 而非空数组
{
  const results = await send({ _tag: 'GUILD_MEMBER_ADD', UserId: 'USER_OPENID_D' });
  assert.equal(results.length, 1, '未覆盖 tag 应返回单个 Fail 结果');
  assert.equal(results[0].code, FAIL, `未覆盖 tag 应返回 Fail(${FAIL})，实际 ${results[0].code}`);
  assert.match(String(results[0].message), /unsupported event tag "GUILD_MEMBER_ADD"/);
}

// 11. 消息类事件行为不变：MessageId 透传为 msg_id（被动回复）
{
  const results = await send({ _tag: 'GROUP_AT_MESSAGE_CREATE', ChannelId: 'GROUP_OPENID_G', MessageId: 'REAL_MSG_ID' });
  assert.equal(results[0].code, OK, `GROUP_AT_MESSAGE_CREATE 应发送成功，实际 ${JSON.stringify(results)}`);
  assert.equal(lastCall().wire.msg_id, 'REAL_MSG_ID', '被动回复应携带 msg_id');
  assert.equal(lastCall().wire.event_id, undefined);
}

// 12. 空 format：维持原有的空数组早退
{
  const results = await new Promise(resolve => {
    void registration.onAction({ action: 'message.send', payload: { event: { _tag: 'GROUP_JOIN_REQUEST', ChannelId: 'X' }, params: { format: [] } } }, resolve);
  });
  assert.deepEqual(results, []);
}

console.log(`use.send 路由验证通过（事件回复 5 组 + 主动消息 4 组，共 ${calls.length} 次发送调用）`);
process.exit(0);
