// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { decodeWire, decodeWireTree, type WireField } from './protocol/index.js';
import type { GroupMemberDecreaseSource, GroupMemberIncreaseSource, NoticeEvent, NoticeUser, PushMessage, RequestEvent } from './types.js';

const COMMAND_MESSAGE_TYPES = new Set([
  40001, 50001, 50002, 50003, 50004, 50005, 50010, 50011, 50012, 50013, 50014, 50015, 50016, 50017, 60001, 70001, 70002, 80001, 80002, 80003, 80004, 80005,
  90001, 90002
]);

const GROUP_MEMBER_INCREASE_TYPES = new Map<number, GroupMemberIncreaseSource>([
  [100100, 'invite'],
  [100101, 'command'],
  [100102, 'qrcode'],
  [100107, 'duoshan'],
  [100109, 'apply'],
  [100111, 'search'],
  [100112, 'activity'],
  [100113, 'face-to-face'],
  [100114, 'circle']
]);

const GROUP_MEMBER_DECREASE_TYPES = new Map<number, GroupMemberDecreaseSource>([
  [100104, 'kick'],
  [100105, 'leave']
]);

/* ---------------------------------------------------------------------------
 * 无 schema wire 辅助（等价 android-ws.ts 的提取 helpers，通知与推送共用）
 * ------------------------------------------------------------------------- */

export function fieldString(fields: WireField[], number: number): string | undefined {
  for (const field of fields) {
    if (field.field === number && field.type === 'varint') {
      return field.value.toString();
    }
    if (field.field === number && field.type === 'string') {
      return field.value;
    }
  }

  return undefined;
}

export function messageChildren(fields: WireField[], number: number): WireField[][] {
  return fields
    .filter((field): field is Extract<WireField, { type: 'message' }> => field.field === number && field.type === 'message')
    .map(field => field.value);
}

export function collectKeyValues(fields: WireField[], number: number): Map<string, string> {
  const values = new Map<string, string>();

  for (const child of messageChildren(fields, number)) {
    const key = fieldString(child, 1);
    const value = fieldString(child, 2);

    if (key && value !== null && value !== undefined) {
      values.set(key, value);
    }
  }

  return values;
}

/* ---------------------------------------------------------------------------
 * cmd500 推送 → Notice / Request 分流
 * ------------------------------------------------------------------------- */

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

function firstString(record: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
      const text = String(value);

      if (text && text !== '0') {
        return text;
      }
    }
  }

  return undefined;
}

function commandPayload(content: string): Record<string, unknown> | undefined {
  try {
    return asRecord(JSON.parse(content));
  } catch {
    return undefined;
  }
}

function noticeUsers(value: unknown): NoticeUser[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const users: NoticeUser[] = [];

  for (const item of value) {
    const user = asRecord(item);
    const uid = firstString(user, ['uid', 'user_id', 'userId']);

    if (!uid) {
      continue;
    }
    const secUid = firstString(user, ['sec_uid', 'secUid', 'sec_user_id', 'secUserId']);
    const nickname = firstString(user, ['nickname', 'nick_name', 'display_name', 'displayName']);

    users.push({
      uid,
      ...(secUid ? { secUid } : {}),
      ...(nickname ? { nickname } : {})
    });
  }

  return users;
}

function groupMemberIncreaseFromPush(push: PushMessage, payload: Record<string, unknown> | undefined): NoticeEvent | undefined {
  if (push.conversationType !== 2 || !payload) {
    return undefined;
  }
  const aweType = Number(payload['aweType'] ?? payload['awe_type'] ?? 0);
  const source = GROUP_MEMBER_INCREASE_TYPES.get(aweType);

  if (!source) {
    return undefined;
  }
  const members = noticeUsers(payload['passive_users'] ?? payload['passiveUsers']);

  if (members.length === 0) {
    return undefined;
  }

  return {
    type: 'group.member-increase',
    conversationId: push.conversationId,
    conversationShortId: push.conversationShortId || push.conversationId,
    conversationType: 2,
    source,
    members,
    operators: noticeUsers(payload['active_users'] ?? payload['activeUsers']),
    raw: push.raw
  };
}

function groupMemberDecreaseFromPush(push: PushMessage, payload: Record<string, unknown> | undefined): NoticeEvent | undefined {
  if (push.conversationType !== 2 || !payload) {
    return undefined;
  }
  const aweType = Number(payload['aweType'] ?? payload['awe_type'] ?? 0);
  const source = GROUP_MEMBER_DECREASE_TYPES.get(aweType);

  if (!source) {
    return undefined;
  }
  const activeUsers = noticeUsers(payload['active_users'] ?? payload['activeUsers']);
  const passiveUsers = noticeUsers(payload['passive_users'] ?? payload['passiveUsers']);
  const members = source === 'leave' ? activeUsers : passiveUsers;

  if (members.length === 0) {
    return undefined;
  }

  return {
    type: 'group.member-decrease',
    conversationId: push.conversationId,
    conversationShortId: push.conversationShortId || push.conversationId,
    conversationType: 2,
    source,
    members,
    // 主动退群没有另一位操作者；SDK 层会把 member 自身投影为 operator。
    operators: source === 'leave' ? [] : activeUsers,
    raw: push.raw
  };
}

function groupMetadataNoticeFromPush(push: PushMessage, payload: Record<string, unknown> | undefined): NoticeEvent | undefined {
  if (push.conversationType !== 2 || !payload) {
    return undefined;
  }
  const aweType = Number(payload['aweType'] ?? payload['awe_type'] ?? 0);
  const base = {
    conversationId: push.conversationId,
    conversationShortId: push.conversationShortId || push.conversationId,
    conversationType: 2 as const,
    operators: noticeUsers(payload['active_users'] ?? payload['activeUsers']),
    raw: push.raw
  };

  if (aweType === 100110) {
    const members = noticeUsers(payload['passive_users'] ?? payload['passiveUsers']);

    if (members.length === 0) {
      return undefined;
    }

    return { type: 'group.admin', ...base, members, enabled: true };
  }
  if (aweType === 100106) {
    const name = firstString(payload, ['new_name', 'newName', 'conversation_name', 'conversationName', 'name']);

    return { type: 'group.name-change', ...base, ...(name ? { name } : {}) };
  }
  if (aweType === 100115) {
    const avatar = firstString(payload, ['new_avatar', 'newAvatar', 'avatar_url', 'avatarUrl', 'avatar']);

    return { type: 'group.avatar-change', ...base, ...(avatar ? { avatar } : {}) };
  }

  return undefined;
}

/** 把 cmd500 中的协议命令消息与用户可见消息分流为 Notice 或 Request。 */
export function noticeFromPush(push: PushMessage): NoticeEvent | RequestEvent | undefined {
  const payload = commandPayload(push.content);
  const groupIncrease = groupMemberIncreaseFromPush(push, payload);

  if (groupIncrease) {
    return groupIncrease;
  }
  const groupDecrease = groupMemberDecreaseFromPush(push, payload);

  if (groupDecrease) {
    return groupDecrease;
  }
  const groupMetadata = groupMetadataNoticeFromPush(push, payload);

  if (groupMetadata) {
    return groupMetadata;
  }
  if (!COMMAND_MESSAGE_TYPES.has(push.messageType)) {
    return undefined;
  }
  if (push.messageType === 40001) {
    const serverMessageId = firstString(payload, ['server_message_id', 'serverMessageId', 'message_id', 'messageId']);

    return {
      type: 'message.recall',
      conversationId: push.conversationId,
      conversationType: push.conversationType,
      ...(serverMessageId ? { serverMessageId } : {}),
      raw: push.raw
    };
  }
  if (push.messageType === 50005) {
    return {
      type: 'conversation.delete',
      conversationId: push.conversationId,
      conversationType: push.conversationType,
      raw: push.raw
    };
  }
  if (push.messageType === 90001) {
    const apply = asRecord(payload?.['apply_info'] ?? payload?.['applyInfo']);
    const groupShortId = firstString(apply ?? payload, ['conv_short_id', 'convShortId', 'conversation_short_id', 'conversationShortId']);
    const requestId = firstString(apply ?? payload, ['apply_id', 'applyId', 'request_id', 'requestId']);

    return {
      type: 'group.join-request',
      conversationId: push.conversationId,
      conversationShortId: groupShortId || push.conversationShortId || push.conversationId,
      conversationType: push.conversationType,
      ...(requestId ? { requestId } : {}),
      content: push.content,
      raw: push.raw
    };
  }

  return {
    type: 'im.command',
    conversationId: push.conversationId,
    conversationType: push.conversationType,
    messageType: push.messageType,
    content: push.content,
    raw: push.raw
  };
}

/* ---------------------------------------------------------------------------
 * Android Frontier 原生通知（Frame 中不携带 MessageBody；目前确认 cmd501/502/507）
 * ------------------------------------------------------------------------- */

/** Android Frontier 原生通知/请求事件（501 已读、502 会话更新、507 好友事件） */
export function extractAndroidNotices(payload: Uint8Array): (NoticeEvent | RequestEvent)[] {
  const top = decodeWire(payload);
  const tree = decodeWireTree(payload);
  const envelopes = messageChildren(top, 8);

  if (messageChildren(top, 6).length > 0) {
    envelopes.push(top);
  }
  const notices: (NoticeEvent | RequestEvent)[] = [];

  for (const envelope of envelopes) {
    for (const body of messageChildren(envelope, 6)) {
      for (const read of messageChildren(body, 501)) {
        notices.push({
          type: 'conversation.read',
          conversationId: fieldString(read, 1) ?? '',
          conversationType: Number(fieldString(read, 2) ?? 0),
          readMessageIndex: fieldString(read, 3) ?? '0',
          readMessageIndexV2: fieldString(read, 4) ?? '0',
          raw: { transport: 'android-frontier', wireTree: tree }
        });
      }
      for (const updated of messageChildren(body, 502)) {
        for (const conversation of messageChildren(updated, 1)) {
          notices.push({
            type: 'conversation.update',
            conversationId: fieldString(conversation, 1) ?? '',
            conversationType: Number(fieldString(conversation, 3) ?? 0),
            raw: { transport: 'android-frontier', wireTree: tree }
          });
        }
      }
      for (const friend of messageChildren(body, 507)) {
        const messageType = Number(fieldString(friend, 1) ?? 0);
        const fromUid = fieldString(friend, 2) ?? '';
        const toUid = fieldString(friend, 3) ?? '';
        const peerUid = fromUid || toUid;
        const content = fieldString(friend, 4);

        if (messageType === 1 && peerUid) {
          notices.push({
            type: 'friend.request',
            applicantUid: peerUid,
            ...(fromUid ? { fromUid } : {}),
            ...(toUid ? { toUid } : {}),
            ...(content ? { content } : {}),
            raw: { transport: 'android-frontier', wireTree: tree }
          });
        } else if ((messageType === 2 || messageType === 3) && peerUid) {
          notices.push({
            type: messageType === 3 ? 'friend.increase' : 'friend.decrease',
            peerUid,
            ...(fromUid ? { fromUid } : {}),
            ...(toUid ? { toUid } : {}),
            ...(content ? { content } : {}),
            raw: { transport: 'android-frontier', wireTree: tree }
          });
        }
      }
    }
  }

  return notices;
}
