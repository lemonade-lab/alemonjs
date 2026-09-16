// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import { logger } from '../logger.js';
import type { ChatMessage, FriendInfo, GroupInfo, PrivateThread, StrangerInfo } from './types.js';

export function isGroupConversationId(conversationId: string): boolean {
  return /^\d+$/.test(conversationId.trim());
}

export function mapProtoConversationListItem(raw: Record<string, unknown>): GroupInfo {
  const conversationId = String(raw['conversationId'] ?? '');
  const conversationType = Number(raw['conversationType'] ?? 0);
  // 群头像在 conversationCoreInfo.icon（对齐 douyin-im）；extInfo 仅补 name 等
  const core = raw['conversationCoreInfo'] as Record<string, unknown> | undefined;
  const ext = raw['extInfo'] as Record<string, unknown> | undefined;
  const setting = (raw['userSetting'] ?? raw['conversationSettingInfo']) as Record<string, unknown> | undefined;
  const memberBox = (raw['members'] ?? raw['firstPageParticipants']) as
    | { members?: Array<Record<string, unknown>>; participants?: Array<Record<string, unknown>> }
    | undefined;
  const avatar = String(core?.['icon'] ?? ext?.['icon'] ?? core?.['avatar'] ?? ext?.['avatar'] ?? '');

  if (isGroupConversationId(conversationId) && !avatar) {
    // 群头像缺失：dump decode 原始字段辅助定位数据源
    logger.debug(
      `[douyin:im] 群头像缺失: keys=${JSON.stringify(Object.keys(raw))} ` +
        `core=${JSON.stringify(core)?.slice(0, 400)} ext=${JSON.stringify(ext)?.slice(0, 400)}`
    );
  }
  const ownerUid = String(ext?.['ownerUid'] ?? ext?.['owner'] ?? core?.['owner'] ?? '');
  // participants 键为 userId（对齐 douyin-im member['uid'] ?? member['userId']）
  const members = (memberBox?.members ?? memberBox?.participants ?? [])
    .map(member => {
      const secUid = String(member['secUid'] ?? '');

      return {
        uid: String(member['uid'] ?? member['userId'] ?? ''),
        role: Number(member['role'] ?? 0),
        ...(secUid ? { secUid } : {})
      };
    })
    .filter(member => member.uid && member.uid !== '0');

  return {
    conversationId,
    conversationShortId: String(raw['conversationShortId'] ?? ''),
    conversationType,
    isGroup: conversationType === 2 || isGroupConversationId(conversationId),
    name: String(core?.['name'] ?? ext?.['name'] ?? ''),
    ...(avatar ? { avatar } : {}),
    ...(ownerUid && ownerUid !== '0' ? { ownerUid } : {}),
    lastMessageTime: Number(setting?.['lastMsgTime'] ?? 0),
    members
  };
}

/**
 * 从 conversationId 解析对端 UID。
 * jumpbyte 私信格式: "0:1:{uid_a}:{uid_b}"
 */
export function parsePeerFromConversationId(conversationId: string, myUid: string): string {
  const parts = conversationId.split(':');

  if (parts.length >= 4 && parts[1] === '1') {
    const uidA = parts[2];
    const uidB = parts[3];

    if (uidA === myUid) {
      return uidB;
    }
    if (uidB === myUid) {
      return uidA;
    }

    return uidB;
  }

  return '';
}

/** 从 conversation 元数据构建 thread（对齐 douyin-im mapThread：peer 资料取 firstPageParticipants/userInfo 的 alias） */
export function mapProtoConversationMeta(conv: Record<string, unknown>, messages: Record<string, unknown>[], myUid: string): PrivateThread {
  const threadId = (conv['conversationId'] as string) ?? '';
  const conversationType = (conv['conversationType'] as number) ?? 1;
  const peerUid = parsePeerFromConversationId(threadId, myUid);

  const participantPage = (conv['firstPageParticipants'] ?? conv['members']) as
    | { members?: Array<Record<string, unknown>>; participants?: Array<Record<string, unknown>> }
    | undefined;
  const userInfo = conv['userInfo'] as Record<string, unknown> | undefined;
  const candidates = participantPage?.participants ?? participantPage?.members ?? [];
  const peerMember = candidates.find(member => String(member['userId'] ?? member['uid'] ?? '') === peerUid);
  const peerInfo = peerMember ?? (String(userInfo?.['userId'] ?? userInfo?.['uid'] ?? '') === peerUid ? userInfo : undefined);
  const peerSecUid = String(peerInfo?.['secUid'] ?? '');
  const peerNick = String(peerInfo?.['alias'] ?? peerInfo?.['nickname'] ?? '');

  const thread: PrivateThread = {
    threadId,
    ...(conv['conversationShortId'] !== null && conv['conversationShortId'] !== undefined ? { conversationShortId: String(conv['conversationShortId']) } : {}),
    conversationType,
    peer: {
      uid: peerUid,
      nickname: peerNick,
      ...(peerSecUid ? { secUid: peerSecUid } : {})
    },
    unreadCount: Number(conv['badgeCount'] ?? conv['unreadCount'] ?? 0),
    updateTime: Number((conv['extInfo'] as Record<string, unknown> | undefined)?.['lastActiveTime'] ?? 0),
    ...(conv['inboxType'] !== null && conv['inboxType'] !== undefined ? { inboxType: conv['inboxType'] as number } : {})
  };

  const lastMsg = messages.find(m => (m['conversationId'] as string) === threadId);

  if (lastMsg) {
    thread.lastMessage = mapProtoMessage(lastMsg);
    if (!thread.updateTime) {
      thread.updateTime = thread.lastMessage.createTime;
    }
  }

  return thread;
}

/** 从单条 message 记录构建 thread（无 conversations 字段时） */
export function mapProtoConversation(raw: Record<string, unknown>, myUid: string): PrivateThread {
  const threadId = (raw['conversationId'] as string) ?? '';
  const conversationType = (raw['conversationType'] as number) ?? 1;
  const peerUid = parsePeerFromConversationId(threadId, myUid) || (conversationType === 1 ? String(raw['sender'] ?? '') : '');
  const ext = raw['ext'] as Record<string, string> | undefined;
  const thread: PrivateThread = {
    threadId,
    ...(raw['conversationShortId'] !== null && raw['conversationShortId'] !== undefined ? { conversationShortId: String(raw['conversationShortId']) } : {}),
    conversationType,
    peer: {
      uid: peerUid,
      nickname: '',
      ...(raw['secSender'] && String(raw['sender']) === peerUid ? { secUid: String(raw['secSender']) } : {})
    },
    unreadCount: 0,
    updateTime: (raw['createTime'] as number) ?? 0,
    ...(ext?.['s:is_stranger'] === 'true' ? { isStranger: true } : {})
  };

  if (raw['content']) {
    thread.lastMessage = mapProtoMessage(raw);
  }

  return thread;
}

export function dedupeThreads(threads: PrivateThread[]): PrivateThread[] {
  const byId = new Map<string, PrivateThread>();

  for (const t of threads) {
    const prev = byId.get(t.threadId);

    if (!prev || t.updateTime >= prev.updateTime) {
      byId.set(t.threadId, t);
    }
  }

  return [...byId.values()];
}

export function mapProtoMessage(raw: Record<string, unknown>): ChatMessage {
  const senderSecUid = String(raw['secSender'] ?? '');
  const indexInConversation = String(raw['indexInConversation'] ?? '');
  const indexInConversationV2 = String(raw['indexInConversationV2'] ?? '');

  return {
    msgId: String(raw['serverMessageId'] ?? ''),
    threadId: (raw['conversationId'] as string) ?? '',
    senderUid: String(raw['sender'] ?? ''),
    ...(senderSecUid ? { senderSecUid } : {}),
    content: (raw['content'] as string) ?? '',
    msgType: (raw['messageType'] as number) ?? 0,
    createTime: (raw['createTime'] as number) ?? 0,
    status: (raw['status'] as number) ?? 0,
    ...(indexInConversation ? { indexInConversation } : {}),
    ...(indexInConversationV2 ? { indexInConversationV2 } : {})
  };
}

/** thread 对端信息 → 业务 peer 摘要 */
function threadPeerSummary(thread: PrivateThread): { uid: string; secUid?: string; nickname: string } {
  const peer = thread.peer;

  return {
    uid: peer.uid,
    ...(peer.secUid ? { secUid: peer.secUid } : {}),
    nickname: peer.nickname ?? ''
  };
}

/** P2P 会话线程 → 好友信息 */
export function mapThreadToFriend(thread: PrivateThread): FriendInfo | undefined {
  const peer = threadPeerSummary(thread);

  if (!peer.uid || !/^\d+$/.test(peer.uid)) {
    return undefined;
  }

  return {
    uid: peer.uid,
    ...(peer.secUid ? { secUid: peer.secUid } : {}),
    nickname: peer.nickname,
    conversationId: thread.threadId,
    conversationShortId: thread.conversationShortId ?? '',
    ...(thread.lastMessage ? { lastMessage: thread.lastMessage } : {}),
    lastMessageTime: thread.lastMessage?.createTime ?? thread.updateTime,
    unreadCount: thread.unreadCount
  };
}

/** 陌生人会话线程 → 陌生人信息 */
export function mapThreadToStranger(thread: PrivateThread): StrangerInfo | undefined {
  const peer = threadPeerSummary(thread);

  if (!peer.uid) {
    return undefined;
  }

  return {
    uid: peer.uid,
    ...(peer.secUid ? { secUid: peer.secUid } : {}),
    ...(peer.nickname ? { nickname: peer.nickname } : {}),
    conversationId: thread.threadId,
    conversationShortId: thread.conversationShortId ?? '',
    ...(thread.lastMessage ? { lastMessage: thread.lastMessage } : {}),
    lastMessageTime: thread.lastMessage?.createTime ?? thread.updateTime,
    unreadCount: thread.unreadCount
  };
}
