// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import protobuf from 'protobufjs';
import type { ImProtoTransport } from './transport.js';
import {
  dedupeThreads,
  mapProtoConversation,
  mapProtoConversationListItem,
  mapProtoConversationMeta,
  mapProtoMessage,
  mapThreadToFriend,
  mapThreadToStranger
} from './mappers.js';
import type {
  ActionResult,
  ChatMessage,
  ConversationAddress,
  FriendInfo,
  FriendRequestInfo,
  GroupInfo,
  GroupJoinRequestInfo,
  GroupMemberInfo,
  ModifyReactionItem,
  PrivateThread,
  RecallItem,
  RecallResult,
  StrangerInfo
} from './types.js';
import { FriendRequestStatus, GroupJoinRequestStatus } from './types.js';

const LONG = protobuf.util.Long as unknown as { fromString(value: string): unknown };

export interface InboxContext {
  transport: ImProtoTransport;
  /** Desktop IM 设备 ID（Cookie 通道 query 用） */
  deviceId: string;
  /** 平台数字 uid（cookie 通道 thread 映射用） */
  platformUid: string;
}

export interface InboxListOptions {
  cursor?: number;
  count?: number;
}

interface ActionBody {
  status?: number;
  extraInfo?: string;
  checkCode?: number | string;
  checkMessage?: string;
}

function parseActionCheckMessage(value: string): { parsed: boolean; code?: number; message?: string } {
  if (!value.trim()) {
    return { parsed: false };
  }
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const rawCode = parsed['status_code'] ?? parsed['statusCode'];
    const code = rawCode === undefined ? undefined : Number(rawCode);
    const message = [parsed['status_msg'], parsed['statusMsg'], parsed['tips'], parsed['toast'], parsed['message']]
      .map(item => String(item ?? ''))
      .find(Boolean);

    return {
      parsed: true,
      ...(code !== undefined && Number.isFinite(code) ? { code } : {}),
      ...(message ? { message } : {})
    };
  } catch {
    return { parsed: false };
  }
}

/** Desktop Cookie 会话动作统一响应归一 */
export function actionResponse(decoded: Record<string, unknown>, bodyKey?: string): ActionResult {
  const envelopeStatus = Number(decoded['statusCode'] ?? 0);
  const payload = decoded['body'] as Record<string, unknown> | undefined;
  const body = (bodyKey ? payload?.[bodyKey] : undefined) as ActionBody | undefined;
  const actionStatus = Number(body?.status ?? 0);
  const checkMessage = String(body?.checkMessage ?? '');
  const checkDetail = parseActionCheckMessage(checkMessage);
  const checkCode = checkDetail.code ?? Number(body?.checkCode ?? 0);
  const statusCode = envelopeStatus || checkCode || actionStatus;
  const statusMsg =
    [checkDetail.message, checkDetail.parsed ? '' : checkMessage, body?.extraInfo, decoded['errorDesc']].map(value => String(value ?? '')).find(Boolean) ?? '';

  return {
    statusCode,
    statusMsg,
    ...(checkCode ? { checkCode } : {})
  };
}

/* ---------------------------------------------------------------------------
 * 会话动作
 * ------------------------------------------------------------------------- */

/** cmd=705, /v1/message/set_property — 消息表情回应（operation 0=添加 1=移除） */
export async function modifyReaction(ctx: InboxContext, deviceId: string, options: ModifyReactionItem): Promise<{ statusCode: number; statusMsg: string }> {
  const decoded = await ctx.transport.sendCookieProto(
    705,
    options.inboxType ?? 0,
    '/v1/message/set_property',
    {
      modifyMessageProperty: {
        propertyList: [
          {
            conversationId: options.conversationId,
            conversationType: options.conversationType ?? 1,
            conversationShortId: LONG.fromString(options.conversationShortId || '0'),
            serverMessageId: LONG.fromString(options.serverMessageId),
            clientMessageId: '',
            modifyPropertyContent: [
              {
                operation: options.enabled ? 0 : 1,
                key: `se:${options.emoji}`,
                value: '',
                idempotentId: options.operatorUid
              }
            ]
          }
        ],
        ticket: ''
      }
    },
    deviceId
  );
  const envelopeStatus = Number(decoded['statusCode'] ?? 0);

  // statusCode=1 表示已应用（幂等），对齐 douyin-im 视为成功
  return {
    statusCode: envelopeStatus === 1 ? 0 : envelopeStatus,
    statusMsg: String(decoded['errorDesc'] ?? '')
  };
}

/** cmd=702, /v1/message/recall — 撤回已投递消息 */
export async function recall(ctx: InboxContext, deviceId: string, options: RecallItem): Promise<RecallResult> {
  const decoded = await ctx.transport.sendCookieProto(
    702,
    options.inboxType ?? 0,
    '/v1/message/recall',
    {
      recallMessage: {
        conversationId: options.conversationId,
        conversationShortId: LONG.fromString(options.conversationShortId || '0'),
        conversationType: options.conversationType ?? 1,
        serverMessageId: LONG.fromString(options.serverMessageId)
      }
    },
    deviceId
  );
  const envelopeStatus = Number(decoded['statusCode'] ?? 0);
  const body = decoded['body'] as Record<string, unknown> | undefined;
  const recallBody = body?.['recallMessage'] as { status?: number } | undefined;
  const actionStatus = recallBody?.status ?? 0;

  return {
    statusCode: envelopeStatus || actionStatus,
    statusMsg: String(decoded['errorDesc'] ?? ''),
    recalled: envelopeStatus === 0 && actionStatus === 0
  };
}

/* ---------------------------------------------------------------------------
 * 会话列表 / 历史消息
 * ------------------------------------------------------------------------- */

/** cmd=2006, /v1/conversation/list — Desktop 群聊元数据列表。 */
export async function listConversations(ctx: InboxContext, deviceId: string, options: InboxListOptions = {}): Promise<GroupInfo[]> {
  const decoded = await ctx.transport.sendCookieProto(
    2006,
    0,
    '/v1/conversation/list',
    {
      conversationList: {
        listType: 1,
        cursor: options.cursor ?? 0,
        sortType: 2,
        limit: options.count ?? 20
      }
    },
    deviceId
  );
  const statusCode = Number(decoded['statusCode'] ?? 0);

  if (statusCode !== 0) {
    throw new Error(`listConversations failed: ${String(decoded['errorDesc'] ?? '')} (code=${statusCode})`);
  }
  const body = decoded['body'] as Record<string, unknown> | null;
  const list = body?.['conversationList'] as { conversations?: Array<Record<string, unknown>> } | undefined;
  const conversations = list?.conversations ?? [];

  return conversations.map(mapProtoConversationListItem);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Desktop Cookie cmd=203。实测 inboxType=1 返回群聊及普通私信；不依赖 Creator IM token。 */
export async function listCookieThreads(
  ctx: InboxContext,
  deviceId: string,
  options: InboxListOptions & { inboxType?: number } = {}
): Promise<PrivateThread[]> {
  const limit = options.count ?? 20;
  const cursor = options.cursor ?? 0;
  let lastError: unknown;

  // 服务端偶发 StatusCodeRPCTimeout(500)，重试 2 次缓解
  for (let attempt = 0; attempt < 3; attempt++) {
    let decoded: Record<string, unknown>;

    try {
      decoded = await ctx.transport.sendCookieProto(
        203,
        options.inboxType ?? 1,
        '/v2/message/get_by_user_init',
        { inbox: { convLimit: limit, msgLimit: limit, cursor } },
        deviceId
      );
    } catch (err) {
      lastError = err;
      await sleep(1000);
      continue;
    }
    const statusCode = Number(decoded['statusCode'] ?? 0);

    if (statusCode !== 0) {
      lastError = new Error(`listCookieThreads failed: ${String(decoded['errorDesc'] ?? '')} (code=${statusCode})`);
      await sleep(1000);
      continue;
    }
    const body = decoded['body'] as Record<string, unknown> | null;
    const inbox = body?.['inbox'] as {
      messages?: unknown[];
      conversations?: unknown[];
    } | null;
    const rawMessages = (inbox?.messages ?? []) as Record<string, unknown>[];
    const rawConversations = (inbox?.conversations ?? []) as Record<string, unknown>[];
    const threads =
      rawConversations.length > 0
        ? rawConversations.map(conversation => mapProtoConversationMeta(conversation, rawMessages, ctx.platformUid))
        : dedupeThreads(rawMessages.map(message => mapProtoConversation(message, ctx.platformUid)));

    return dedupeThreads(threads);
  }

  throw lastError instanceof Error ? lastError : new Error('listCookieThreads failed');
}

/** cmd=2047, /v1/message/get_recent_stranger_message — 陌生人消息（Desktop Cookie 通道，对齐 douyin-im ImStrangerApi） */
export async function listStrangerThreads(ctx: InboxContext, _options: InboxListOptions = {}): Promise<PrivateThread[]> {
  const decoded = await ctx.transport.sendCookieProto(
    2047,
    1,
    '/v1/message/get_recent_stranger_message',
    {
      getRecentStrangerMessage: {
        latestStrangerVersion: LONG.fromString('0'),
        earliestStrangerVersion: LONG.fromString('0'),
        source: 'code_up',
        newUser: 0,
        bizInfo: ''
      }
    },
    ctx.deviceId
  );

  const statusCode = Number(decoded['statusCode'] ?? 0);

  if (statusCode !== 0) {
    throw new Error(`listStrangerThreads failed: ${String(decoded['errorDesc'] ?? '')} (code=${statusCode})`);
  }

  const body = decoded['body'] as Record<string, unknown> | null;
  const page = body?.['getRecentStrangerMessage'] as { messages?: unknown[] } | null;
  const rows = (page?.messages ?? []) as Record<string, unknown>[];
  const rawMessages = rows.flatMap(row => (row['messages'] ?? []) as Record<string, unknown>[]);

  return dedupeThreads(rawMessages.map(message => mapProtoConversation(message, ctx.platformUid)));
}

/** cmd=301, /v1/message/get_by_conversation — 会话历史消息（对齐 douyin-im ImInboxApi.getMessages） */
export async function getChatHistory(
  ctx: InboxContext,
  deviceId: string,
  options: ConversationAddress & { cursor?: string | number; count?: number }
): Promise<ChatMessage[]> {
  const cursor = options.cursor ?? 0;

  if (!/^\d+$/.test(String(cursor)) || (typeof cursor === 'number' && !Number.isSafeInteger(cursor))) {
    throw new Error('History cursor must be a decimal string or a safe integer');
  }
  if (options.count !== undefined && (!Number.isSafeInteger(options.count) || options.count < 1)) {
    throw new Error('History count must be a positive integer');
  }
  const decoded = await ctx.transport.sendCookieProto(
    301,
    1,
    '/v1/message/get_by_conversation',
    {
      conversationMessages: {
        conversationId: options.conversationId,
        conversationType: options.conversationType,
        conversationShortId: LONG.fromString(options.conversationShortId),
        direction: 1,
        anchorIndex: LONG.fromString(String(cursor)),
        limit: options.count ?? 20
      }
    },
    deviceId
  );

  const statusCode = Number(decoded['statusCode'] ?? 0);

  if (statusCode !== 0) {
    throw new Error(`getChatHistory failed: ${String(decoded['errorDesc'] ?? '')} (code=${statusCode})`);
  }

  const body = decoded['body'] as Record<string, unknown> | null;
  const cm = body?.['conversationMessages'] as {
    messages?: unknown[];
  } | null;

  return (cm?.messages ?? []).map(m => mapProtoMessage(m as Record<string, unknown>));
}

/* ---------------------------------------------------------------------------
 * 联系人业务视图
 * ------------------------------------------------------------------------- */

/** 好友列表：Desktop Cookie 会话（P2P）映射为好友信息 */
export async function getFriendList(ctx: InboxContext, deviceId: string, options: InboxListOptions = {}): Promise<FriendInfo[]> {
  const threads = await listCookieThreads(ctx, deviceId, options);

  return threads
    .filter(thread => thread.conversationType === 1 || thread.conversationType === undefined)
    .map(mapThreadToFriend)
    .filter((friend): friend is FriendInfo => friend !== null && friend !== undefined);
}

/** 群列表：cmd 2006 会话中 type=2 / 纯数字会话 ID 的条目 */
export async function getGroupList(ctx: InboxContext, deviceId: string, options: InboxListOptions = {}): Promise<GroupInfo[]> {
  const conversations = await listConversations(ctx, deviceId, options);

  return conversations.filter(conversation => conversation.isGroup);
}

/** 群成员列表：cmd=605 分页拉全量 */
export async function getGroupMembers(ctx: InboxContext, deviceId: string, options: ConversationAddress): Promise<GroupMemberInfo[]> {
  const members: GroupMemberInfo[] = [];
  let cursor = '0';
  const seenCursors = new Set<string>();

  for (;;) {
    if (seenCursors.has(cursor)) {
      throw new Error('participant cursor did not advance');
    }
    seenCursors.add(cursor);
    const decoded = await ctx.transport.sendCookieProto(
      605,
      options.inboxType ?? 0,
      '/v1/conversation/participants_list',
      {
        conversationParticipants: {
          conversationId: options.conversationId,
          conversationShortId: LONG.fromString(options.conversationShortId),
          conversationType: options.conversationType,
          cursor: LONG.fromString(cursor),
          limit: 100
        }
      },
      deviceId
    );
    const result = actionResponse(decoded, 'conversationParticipants');

    if (result.statusCode !== 0) {
      throw new Error(`getGroupMembers failed: ${result.statusMsg} (code=${result.statusCode})`);
    }
    const payload = decoded['body'] as Record<string, unknown> | undefined;
    const body = payload?.['conversationParticipants'] as
      | {
          participantsPage?: {
            participants?: Array<Record<string, unknown>>;
            hasMore?: boolean;
            cursor?: string | number | { toString(): string };
          };
        }
      | undefined;
    const participantPage = body?.participantsPage;

    for (const participant of participantPage?.participants ?? []) {
      const uid = String(participant['userId'] ?? '');

      if (!uid) {
        continue;
      }
      const secUid = String(participant['secUid'] ?? '');
      const alias = String(participant['alias'] ?? '');
      const sortOrder = String(participant['sortOrder'] ?? '');
      const leftBlockTime = String(participant['leftBlockTime'] ?? '');
      const ext = participant['ext'];

      members.push({
        uid,
        role: Number(participant['role'] ?? 0),
        ...(secUid ? { secUid } : {}),
        ...(alias ? { alias } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(participant['blocked'] !== undefined ? { blocked: Number(participant['blocked']) } : {}),
        ...(leftBlockTime ? { leftBlockTime } : {}),
        ...(ext && typeof ext === 'object' ? { ext: ext as Record<string, string> } : {})
      });
    }
    if (!participantPage?.hasMore) {
      return members;
    }
    const nextCursor = String(participantPage.cursor ?? '');

    if (!nextCursor) {
      throw new Error('participant cursor did not advance');
    }
    cursor = nextCursor;
  }
}

/** 陌生人会话列表 */
export async function getStrangerList(ctx: InboxContext, options: InboxListOptions = {}): Promise<StrangerInfo[]> {
  const threads = await listStrangerThreads(ctx, options);

  return threads.map(mapThreadToStranger).filter((stranger): stranger is StrangerInfo => stranger !== null && stranger !== undefined);
}

/* ---------------------------------------------------------------------------
 * 好友申请 / 入群申请（列表 + 审批）
 * ------------------------------------------------------------------------- */

function joinRequestData(value: Record<string, unknown> | undefined): GroupJoinRequestInfo | undefined {
  if (!value) {
    return undefined;
  }
  const requestId = String(value['applyId'] ?? '');
  const applicantUid = String(value['userId'] ?? '');
  const groupShortId = String(value['convShortId'] ?? '');

  if (!requestId || !applicantUid || !groupShortId) {
    return undefined;
  }
  const applicantSecUid = String(value['secUid'] ?? '');
  const reason = String(value['applyReason'] ?? '');
  const inviterUid = String(value['inviteUserId'] ?? '');
  const inviterSecUid = String(value['secInviteUid'] ?? '');
  const createdAt = String(value['createTime'] ?? '');
  const modifiedAt = String(value['modifyTime'] ?? '');
  const moderatorUid = String(value['modifyUser'] ?? '');
  const ext = value['ext'];

  return {
    requestId,
    applicantUid,
    groupShortId,
    conversationType: Number(value['conversationType'] ?? 2),
    status: Number(value['applyStatus'] ?? GroupJoinRequestStatus.PENDING) as GroupJoinRequestStatus,
    ...(applicantSecUid ? { applicantSecUid } : {}),
    ...(reason ? { reason } : {}),
    ...(inviterUid && inviterUid !== '0' ? { inviterUid } : {}),
    ...(inviterSecUid ? { inviterSecUid } : {}),
    ...(createdAt && createdAt !== '0' ? { createdAt } : {}),
    ...(modifiedAt && modifiedAt !== '0' ? { modifiedAt } : {}),
    ...(moderatorUid && moderatorUid !== '0' ? { moderatorUid } : {}),
    ...(ext && typeof ext === 'object' ? { ext: ext as Record<string, string> } : {})
  };
}

function friendRequestData(value: Record<string, unknown> | undefined): FriendRequestInfo | undefined {
  if (!value) {
    return undefined;
  }
  const applicantUid = String(value['userId'] ?? '');

  if (!applicantUid || applicantUid === '0') {
    return undefined;
  }
  const profile = value['profile'] as Record<string, unknown> | undefined;
  const ext = value['ext'];
  const extRecord = ext && typeof ext === 'object' ? (ext as Record<string, string>) : undefined;
  const nickname = String(profile?.['nickName'] ?? '');
  const avatar = String(profile?.['protrait'] ?? '');
  const requestedAt = String(value['applyTimeSecond'] ?? '');
  const message = String(extRecord?.['apply_reason'] ?? extRecord?.['applyReason'] ?? extRecord?.['message'] ?? '');

  return {
    applicantUid,
    status: Number(value['status'] ?? FriendRequestStatus.PENDING) as FriendRequestStatus,
    ...(nickname ? { nickname } : {}),
    ...(avatar ? { avatar } : {}),
    ...(requestedAt && requestedAt !== '0' ? { requestedAt } : {}),
    ...(message ? { message } : {}),
    ...(extRecord ? { ext: extRecord } : {})
  };
}

/** cmd=2027, /v1/conversation/get_audit_list — 入群申请列表 */
export async function getGroupJoinRequests(
  ctx: InboxContext,
  deviceId: string,
  options: { conversationShortId?: string } = {}
): Promise<GroupJoinRequestInfo[]> {
  const requests: GroupJoinRequestInfo[] = [];
  let cursor = '0';
  const seenCursors = new Set<string>();

  for (;;) {
    if (seenCursors.has(cursor)) {
      throw new Error('join-request cursor did not advance');
    }
    seenCursors.add(cursor);
    const decoded = await ctx.transport.sendCookieProto(
      2027,
      1,
      '/v1/conversation/get_audit_list',
      {
        getConversationAuditList: {
          cursor: LONG.fromString(cursor),
          limit: 100
        }
      },
      deviceId
    );
    const result = actionResponse(decoded);

    if (result.statusCode !== 0) {
      throw new Error(`getGroupJoinRequests failed: ${result.statusMsg} (code=${result.statusCode})`);
    }
    const payload = decoded['body'] as Record<string, unknown> | undefined;
    const body = payload?.['getConversationAuditList'] as
      | {
          applyInfoList?: Array<Record<string, unknown>>;
          nextCursor?: string | number | { toString(): string };
          hasMore?: boolean;
        }
      | undefined;

    for (const raw of body?.applyInfoList ?? []) {
      const request = joinRequestData(raw);

      if (request && (!options.conversationShortId || request.groupShortId === options.conversationShortId)) {
        requests.push(request);
      }
    }
    if (!body?.hasMore) {
      return requests;
    }
    const nextCursor = String(body.nextCursor ?? '');

    if (!nextCursor) {
      throw new Error('join-request cursor did not advance');
    }
    cursor = nextCursor;
  }
}

/** cmd=902, /v1/conversation/set_conversation_core_info — 设置群名 */
export async function setGroupName(ctx: InboxContext, deviceId: string, address: ConversationAddress, name: string): Promise<ActionResult> {
  const decoded = await ctx.transport.sendCookieProto(
    902,
    1,
    '/v1/conversation/set_conversation_core_info',
    {
      setConversationCoreInfo: {
        conversationId: address.conversationId,
        conversationShortId: address.conversationShortId ? LONG.fromString(address.conversationShortId) : undefined,
        conversationType: address.conversationType,
        name,
        isNameSet: true
      }
    },
    deviceId
  );

  return actionResponse(decoded, 'setConversationCoreInfo');
}

/** cmd=2025, /v1/conversation/ack_apply — 审批入群申请 */
export async function reviewGroupJoinRequest(
  ctx: InboxContext,
  deviceId: string,
  requestId: string,
  status: GroupJoinRequestStatus.APPROVED | GroupJoinRequestStatus.REJECTED
): Promise<ActionResult & { request?: GroupJoinRequestInfo }> {
  if (!/^\d+$/.test(requestId)) {
    throw new Error('join request id must be numeric');
  }
  const decoded = await ctx.transport.sendCookieProto(
    2025,
    1,
    '/v1/conversation/ack_apply',
    {
      ackConversationApply: {
        applyId: LONG.fromString(requestId),
        applyStatus: status,
        bizExt: {}
      }
    },
    deviceId
  );
  const result = actionResponse(decoded, 'ackConversationApply');
  const payload = decoded['body'] as Record<string, unknown> | undefined;
  const body = payload?.['ackConversationApply'] as
    | {
        applyInfo?: Record<string, unknown>;
      }
    | undefined;
  const request = joinRequestData(body?.applyInfo);

  return { ...result, ...(request ? { request } : {}) };
}

/** cmd=20481, /v1/friend/get_receive_apply_list — 好友申请列表 */
export async function getFriendRequests(ctx: InboxContext, deviceId: string, options: { status?: FriendRequestStatus } = {}): Promise<FriendRequestInfo[]> {
  const requests: FriendRequestInfo[] = [];
  let cursor = '0';
  const seenCursors = new Set<string>();

  for (;;) {
    if (seenCursors.has(cursor)) {
      throw new Error('friend-request cursor did not advance');
    }
    seenCursors.add(cursor);
    const decoded = await ctx.transport.sendCookieProto(
      20481,
      0,
      '/v1/friend/get_receive_apply_list',
      {
        getFriendReceiveApplyList: {
          cursor: LONG.fromString(cursor),
          limit: LONG.fromString('100'),
          getTotalCount: true,
          status: options.status ?? FriendRequestStatus.PENDING
        }
      },
      deviceId
    );
    const result = actionResponse(decoded);

    if (result.statusCode !== 0) {
      throw new Error(`getFriendRequests failed: ${result.statusMsg} (code=${result.statusCode})`);
    }
    const payload = decoded['body'] as Record<string, unknown> | undefined;
    const body = payload?.['getFriendReceiveApplyList'] as
      | {
          nextCursor?: string | number | { toString(): string };
          hasMore?: boolean;
          userList?: Array<Record<string, unknown>>;
        }
      | undefined;

    for (const raw of body?.userList ?? []) {
      const request = friendRequestData(raw);

      if (request) {
        requests.push(request);
      }
    }
    if (!body?.hasMore) {
      return requests;
    }
    const nextCursor = String(body.nextCursor ?? '');

    if (!nextCursor) {
      throw new Error('friend-request cursor did not advance');
    }
    cursor = nextCursor;
  }
}

/** cmd=2049, /v1/friend/reply_apply — 审批好友申请 */
export async function reviewFriendRequest(
  ctx: InboxContext,
  deviceId: string,
  applicantUid: string,
  status: FriendRequestStatus.APPROVED | FriendRequestStatus.REJECTED
): Promise<ActionResult> {
  if (!/^\d+$/.test(applicantUid)) {
    throw new Error('friend request uid must be numeric');
  }
  const decoded = await ctx.transport.sendCookieProto(
    2049,
    0,
    '/v1/friend/reply_apply',
    {
      replyFriendApply: {
        userId: [LONG.fromString(applicantUid)],
        attitude: status,
        ext: {}
      }
    },
    deviceId
  );

  return actionResponse(decoded, 'replyFriendApply');
}
