// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
import type { ImageResource, VideoResource, FileAsset, LinkCard, UserCard } from './media.js';

/* ---------------------------------------------------------------------------
 * 会话与消息
 * ------------------------------------------------------------------------- */

export interface ConversationMember {
  uid: string;
  secUid?: string;
  role: number;
}

/** cmd 2006 返回的会话；纯数字 ID 且 type=2 的条目为群聊。 */
export interface GroupInfo {
  conversationId: string;
  conversationShortId: string;
  conversationType: number;
  isGroup: boolean;
  name: string;
  avatar?: string;
  ownerUid?: string;
  lastMessageTime: number;
  members: ConversationMember[];
}

export interface ThreadPeer {
  uid: string;
  secUid?: string;
  nickname: string;
  avatarThumb?: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  msgId: string;
  threadId: string;
  senderUid: string;
  senderSecUid?: string;
  content: string;
  msgType: number;
  createTime: number;
  status: number;
  indexInConversation?: string;
  indexInConversationV2?: string;
  [key: string]: unknown;
}

/** 会话线程（get_by_user_init 返回；陌生人/好友列表的中间结构） */
export interface PrivateThread {
  threadId: string;
  /** protobuf int64，必须用字符串避免精度丢失 */
  conversationShortId?: string;
  conversationType?: number;
  peer: ThreadPeer;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updateTime: number;
  [key: string]: unknown;
}

/** 好友（P2P 会话对端）信息 */
export interface FriendInfo {
  uid: string;
  secUid?: string;
  nickname: string;
  conversationId: string;
  conversationShortId: string;
  lastMessage?: ChatMessage;
  lastMessageTime: number;
  unreadCount: number;
}

/** 陌生人会话信息 */
export interface StrangerInfo {
  uid: string;
  nickname?: string;
  conversationId: string;
  conversationShortId: string;
  lastMessage?: ChatMessage;
  lastMessageTime: number;
  unreadCount: number;
}

/* ---------------------------------------------------------------------------
 * 发送
 * ------------------------------------------------------------------------- */

/** 会话寻址（发送/撤回等共用） */
export interface ConversationAddress {
  conversationId: string;
  conversationShortId: string;
  conversationType: 1 | 2;
  inboxType?: number;
}

/** 引用消息元数据；在 cmd100 field 11 编码，正文仍使用普通文本 content。 */
export interface SendMessageReference {
  referencedMessageId: string;
  hint: string;
  rootMessageId?: string;
  rootMessageConvIndex?: string;
}

export interface SendMessageItem {
  conversationId: string;
  conversationShortId: string;
  conversationType?: 1 | 2;
  inboxType?: number;
  /** 消息 content；普通文本可直接传文本，会自动包装为 desktop 模板 */
  content: string;
  messageType?: number;
  /** 引用消息；提供时走 reply 路径 */
  reference?: SendMessageReference;
  /** @ 提及的用户 uid（sendMessage 字段 9） */
  mentionedUsers?: string[];
}

/** 消息表情回应（cmd=705 set_property，key=se:<emoji>） */
export interface ModifyReactionItem extends ConversationAddress {
  serverMessageId: string;
  /** 抖音表态键值（skey 文本表情，如 '[爱心]'） */
  emoji: string;
  /** 表态者 uid（bot 自身） */
  operatorUid: string;
  /** true 添加 / false 移除 */
  enabled: boolean;
}

export interface SendMessageResponse {
  statusCode: number;
  statusMsg: string;
  serverMessageId?: string;
  clientMessageId?: string;
  /** 内容安全审核状态码（0=通过，非0=被拦截/需审核） */
  checkCode?: number;
}

export interface RecallItem extends ConversationAddress {
  serverMessageId: string;
}

export interface RecallResult {
  statusCode: number;
  statusMsg: string;
  recalled: boolean;
}

export interface ActionResult {
  statusCode: number;
  statusMsg: string;
  checkCode?: number;
}

/* ---------------------------------------------------------------------------
 * 群成员 / 申请
 * ------------------------------------------------------------------------- */

export interface GroupMemberInfo {
  uid: string;
  secUid?: string;
  nickname?: string;
  avatar?: string;
  role: number;
  alias?: string;
  sortOrder?: string;
  blocked?: number;
  leftBlockTime?: string;
  ext?: Readonly<Record<string, string>>;
}

export enum GroupJoinRequestStatus {
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
  INVALID = 4
}

export interface GroupJoinRequestInfo {
  requestId: string;
  applicantUid: string;
  applicantSecUid?: string;
  applicantNickname?: string;
  applicantAvatar?: string;
  groupShortId: string;
  conversationType: number;
  status: GroupJoinRequestStatus;
  reason?: string;
  inviterUid?: string;
  inviterSecUid?: string;
  createdAt?: string;
  modifiedAt?: string;
  moderatorUid?: string;
  ext?: Readonly<Record<string, string>>;
}

export enum FriendRequestStatus {
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3,
  INVALID = 4
}

export interface FriendRequestInfo {
  applicantUid: string;
  nickname?: string;
  avatar?: string;
  requestedAt?: string;
  status: FriendRequestStatus;
  message?: string;
  ext?: Readonly<Record<string, string>>;
}

/* ---------------------------------------------------------------------------
 * 推送 / 通知 / 请求事件
 * ------------------------------------------------------------------------- */

/** 被引用消息（回复）信息：同 cmd=100 refMsgInfo 字段结构 */
export interface MessageReference {
  referencedMessageId: string;
  hint: string;
  rootMessageId?: string;
}

/** WS 原始推送（解析前中间结构，等价参考 ImPushMessage） */
export interface PushMessage {
  cmd: number;
  inboxType?: number;
  conversationId: string;
  conversationShortId: string;
  conversationType: number;
  senderUid: string;
  senderSecUid?: string;
  content: string;
  messageType: number;
  serverMessageId?: string;
  createTime?: string;
  indexInConversation?: string;
  indexInConversationV2?: string;
  reference?: MessageReference;
  raw: Record<string, unknown>;
}

/** 入站业务消息：原始推送 + 解析内容 + 展示文本 */
export interface InboundMessage extends PushMessage {
  parsed: ParsedMessageContent;
  /** 展示文本（图片/视频等富媒体回退为 [图片] 等占位） */
  text: string;
}

export type GroupMemberIncreaseSource = 'invite' | 'command' | 'qrcode' | 'duoshan' | 'apply' | 'search' | 'activity' | 'face-to-face' | 'circle';

export type GroupMemberDecreaseSource = 'kick' | 'leave';

export interface NoticeUser {
  uid: string;
  secUid?: string;
  nickname?: string;
}

/** 业务通知事件（撤回/好友增减/群成员增减/已读等；好友与入群申请分流到 RequestEvent） */
export type NoticeEvent =
  | {
      /** cmd=500 f500 property 推送的消息表情回应（ModifyPropertyBody 下发）。 */
      type: 'message.reaction';
      conversationId: string;
      serverMessageId: string;
      /** 抖音表态键值（se: 后文本，如 '[爱心]'） */
      emoji: string;
      /** 表态者 uid（idempotent_id） */
      operatorUid: string;
      /** true 添加 / false 移除 */
      isSet: boolean;
      raw: Record<string, unknown>;
    }
  | {
      /** cmd508 的好友关系建立事实。 */
      type: 'friend.increase';
      peerUid: string;
      fromUid?: string;
      toUid?: string;
      content?: string;
      ext?: Readonly<Record<string, string>>;
      raw: Record<string, unknown>;
    }
  | {
      /** cmd508 的好友关系解除事实。 */
      type: 'friend.decrease';
      peerUid: string;
      fromUid?: string;
      toUid?: string;
      content?: string;
      ext?: Readonly<Record<string, string>>;
      raw: Record<string, unknown>;
    }
  | {
      type: 'conversation.read';
      conversationId: string;
      conversationType: number;
      readMessageIndex: string;
      readMessageIndexV2: string;
      raw: Record<string, unknown>;
    }
  | {
      type: 'conversation.update';
      conversationId: string;
      conversationType: number;
      raw: Record<string, unknown>;
    }
  | {
      type: 'conversation.delete';
      conversationId: string;
      conversationType: number;
      raw: Record<string, unknown>;
    }
  | {
      type: 'message.recall';
      conversationId: string;
      conversationType: number;
      serverMessageId?: string;
      raw: Record<string, unknown>;
    }
  | {
      /** 群系统消息中的成员加入事实；一条消息可以包含多个成员。 */
      type: 'group.member-increase';
      conversationId: string;
      conversationShortId: string;
      conversationType: 2;
      source: GroupMemberIncreaseSource;
      members: NoticeUser[];
      operators: NoticeUser[];
      raw: Record<string, unknown>;
    }
  | {
      /** 群系统消息中的成员离开事实；kick 的 passive_users 为离群成员，leave 的 active_users 为离群成员。 */
      type: 'group.member-decrease';
      conversationId: string;
      conversationShortId: string;
      conversationType: 2;
      source: GroupMemberDecreaseSource;
      members: NoticeUser[];
      operators: NoticeUser[];
      raw: Record<string, unknown>;
    }
  | {
      /** messageType=7, aweType=100110；设为管理员。 */
      type: 'group.admin';
      conversationId: string;
      conversationShortId: string;
      conversationType: 2;
      members: NoticeUser[];
      operators: NoticeUser[];
      enabled: true;
      raw: Record<string, unknown>;
    }
  | {
      /** messageType=7, aweType=100106；name 取不到时仍保留通知和 raw。 */
      type: 'group.name-change';
      conversationId: string;
      conversationShortId: string;
      conversationType: 2;
      name?: string;
      operators: NoticeUser[];
      raw: Record<string, unknown>;
    }
  | {
      /** messageType=7, aweType=100115；avatar 取不到时仍保留通知和 raw。 */
      type: 'group.avatar-change';
      conversationId: string;
      conversationShortId: string;
      conversationType: 2;
      avatar?: string;
      operators: NoticeUser[];
      raw: Record<string, unknown>;
    }
  | {
      type: 'im.command';
      conversationId: string;
      conversationType: number;
      messageType: number;
      content: string;
      raw: Record<string, unknown>;
    };

/** 需要上层处理的请求事件（好友申请 / 入群申请） */
export type RequestEvent =
  | {
      /** cmd508 的 SendApply 信号；SDK 收到后刷新可处理的好友申请列表。 */
      type: 'friend.request';
      applicantUid: string;
      fromUid?: string;
      toUid?: string;
      content?: string;
      ext?: Readonly<Record<string, string>>;
      raw: Record<string, unknown>;
    }
  | {
      /** cmd500 messageType=90001；SDK 收到后拉取审核列表再生成可操作 request。 */
      type: 'group.join-request';
      conversationId: string;
      conversationShortId: string;
      conversationType: number;
      requestId?: string;
      content: string;
      raw: Record<string, unknown>;
    };

/* ---------------------------------------------------------------------------
 * 消息内容解析（kind 全集）
 * ------------------------------------------------------------------------- */

/** 合并转发节点（messageType=136 list_content + msg_ids） */
export interface ForwardNode {
  /** 发送者 uid */
  uid: string;
  /** 发送者昵称 */
  nickname: string;
  /** 节点文本摘要（图片为 [图片] 等） */
  text: string;
  /** 节点消息类型（7 文本 / 27 图片 …） */
  msgType: number;
  /** 节点 aweType（700 文本 / 2702 图片 …） */
  aweType: number;
  /** 节点消息 id */
  msgId: string;
  /** 发送者 secUid（如有） */
  secUid?: string;
  /** 节点发送时间 ms */
  createTime?: number;
}

export type ParsedMessageContent =
  | { kind: 'text'; text: string; aweType: number }
  | { kind: 'image'; text: string; aweType: number; image: ImageResource }
  | { kind: 'video'; text: string; aweType: number; video: VideoResource }
  | { kind: 'emoji'; text: string; aweType: number; url: string }
  | { kind: 'file'; text: string; aweType: number; file: FileAsset; value: Record<string, unknown> }
  | { kind: 'link'; text: string; aweType: number; link: LinkCard; value: Record<string, unknown> }
  | { kind: 'user'; text: string; aweType: number; user: UserCard; value: Record<string, unknown> }
  | { kind: 'audio'; text: string; aweType: number; audio: { urls: string[]; uri: string }; value: Record<string, unknown> }
  | {
      kind: 'share';
      text: string;
      aweType: number;
      share: { itemId: string; title: string; authorUid: string; authorSecUid: string };
      value: Record<string, unknown>;
    }
  | { kind: 'forward'; text: string; aweType: number; nodes: ForwardNode[]; value: Record<string, unknown> }
  | { kind: 'unknown'; text: string; aweType: number; value: Record<string, unknown> | string };
