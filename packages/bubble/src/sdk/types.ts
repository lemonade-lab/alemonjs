/**
 * 可用的事件类型枚举
 */
export const AvailableIntentsEventsEnum = [
  'MESSAGE_CREATE',
  'MESSAGE_UPDATE',
  'MESSAGE_DELETE',
  'MESSAGE_UNPIN',
  'DM_MESSAGE_CREATE',
  'DM_MESSAGE_UPDATE',
  'DM_MESSAGE_DELETE',
  'DM_MESSAGE_UNPIN',
  'GUILD_MEMBER_ADD',
  'GUILD_MEMBER_UPDATE',
  'GUILD_MEMBER_REMOVE',
  'EVENTS_SUBSCRIBED',
  'EVENTS_UNSUBSCRIBED',
  'SUBSCRIBE_DENIED',
  'BOT_READY'
] as const;

export type IntentsEnum = (typeof AvailableIntentsEventsEnum)[number];

export const AIntentsEventsEnum: IntentsEnum[] = Array.from(AvailableIntentsEventsEnum);

/**
 * 基础用户信息
 */
export interface User {
  id: string | number;
  username: string;
  avatar?: string | null;
  bot?: boolean;
  nickname?: string;
}

/**
 * 基础频道信息
 */
export interface Channel {
  id: string | number;
  name: string;
  type?: number;
  guild_id?: string | number;
}

/**
 * 基础服务器信息
 */
export interface Guild {
  id: string | number;
  name: string;
}

/**
 * 消息附件信息
 */
export interface Attachment {
  path: string;
  url: string;
  contentType: string;
  size: number;
  filename: string;
  category?: string;
}

/**
 * 基础消息结构
 */
export interface BaseMessage {
  id: string | number;
  content: string;
  type?: string | number;
  channelId?: string | number;
  guildId?: string | number;
  authorId?: string | number;
  author: {
    id: number;
    is_bot?: boolean;
    avatar?: string | null;
    username: string;
  };
  attachment?: Attachment[];
  createdAt?: string;
}

/**
 * 频道消息创建事件
 */
export interface MessageCreateEvent extends BaseMessage {
  mentions?: any[];
}

/**
 * 私聊消息创建事件
 */
export interface DmMessageCreateEvent extends BaseMessage {
  threadId?: string | number;
}

/**
 * 消息更新事件
 */
export type MessageUpdateEvent = BaseMessage;

/**
 * 消息删除事件
 */
export interface MessageDeleteEvent {
  id: string | number;
  channel_id?: string | number;
  guild_id?: string | number;
}

/**
 * 服务器成员事件
 */
export interface GuildMemberEvent {
  user?: User;
  user_id?: string | number;
  guild_id?: string | number;
  nickname?: string;
  roles?: number[];
}

/**
 * BOT_READY 事件数据
 */
export interface BotReadyEvent {
  session_id?: string;
  resume_gateway_url?: string;
  guilds?: Guild[];
  dm_threads?: Array<{
    id: string | number;
    user_id?: string | number;
  }>;
  available_events?: string[];
}

/**
 * 事件订阅成功事件
 */
export interface EventsSubscribedEvent {
  subscribedEvents: string[];
}

/**
 * 事件取消订阅成功事件
 */
export interface EventsUnsubscribedEvent {
  unsubscribedEvents: string[];
}

/**
 * 订阅被拒绝事件
 */
export interface SubscribeDeniedEvent {
  reason?: string;
  events?: string[];
}

/**
 * 机器人信息响应
 */
export interface BotInfo {
  id: number;
  name: string;
  botUser?: {
    id: number;
    name: string;
  };
}

/**
 * 发送消息请求载荷
 */
export interface SendMessagePayload {
  content?: string;
  type?: string;
  attachments?: Attachment[];
  components?: any[];
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  file: Attachment;
}

/**
 * 文件配额信息
 */
export interface FileQuota {
  usage: {
    dailyUsedBytes: number;
    monthlyUsedBytes: number;
  };
  limits: {
    withMessage: Record<string, any>;
    noMessage: Record<string, any>;
  };
}

/**
 * 所有事件类型的映射
 */
export interface BubbleEventMap {
  MESSAGE_CREATE: MessageCreateEvent;
  DM_MESSAGE_CREATE: DmMessageCreateEvent;
}
