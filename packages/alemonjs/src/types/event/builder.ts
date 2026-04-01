import { Guild, Channel } from './base/guild';
import { Message, MessageText, MessageMedia, MessageOpen } from './base/message';
import { Platform } from './base/platform';
import { User } from './base/user';
import { AutoFields } from './base/auto';
import { EventKeys, Events } from './map';

/**
 * 事件保留字段名，add() 方法在类型层面禁止使用
 */
export type ReservedEventKeys =
  | keyof Guild
  | keyof Channel
  | keyof User
  | keyof Message
  | keyof MessageText
  | keyof MessageMedia
  | keyof MessageOpen
  | keyof Platform
  | keyof AutoFields
  | 'name'
  | 'Timestamp';

// ── 条件方法：仅当 Events[T] 包含对应基础类型时才暴露 ──

type GuildMethods<T extends EventKeys> = Events[T] extends Guild ? { addGuild(params: Guild): EventBuilder<T> } : Record<string, never>;

type ChannelMethods<T extends EventKeys> = Events[T] extends Channel ? { addChannel(params: Channel): EventBuilder<T> } : Record<string, never>;

type UserMethods<T extends EventKeys> = Events[T] extends User ? { addUser(params: User): EventBuilder<T> } : Record<string, never>;

type MessageMethods<T extends EventKeys> = Events[T] extends Message ? { addMessage(params: Message): EventBuilder<T> } : Record<string, never>;

type TextMethods<T extends EventKeys> = Events[T] extends MessageText ? { addText(params: MessageText): EventBuilder<T> } : Record<string, never>;

type MediaMethods<T extends EventKeys> = Events[T] extends MessageMedia ? { addMedia(params: MessageMedia): EventBuilder<T> } : Record<string, never>;

type OpenMethods<T extends EventKeys> = Events[T] extends MessageOpen ? { addOpen(params: MessageOpen): EventBuilder<T> } : Record<string, never>;

/**
 * 事件构建器类型：根据事件名 T 只暴露该事件实际包含的字段方法
 *
 * addPlatform / addMessage / add — 所有事件均可调用
 *
 * | 事件                         | Guild | Channel | User | Text | Media | Open |
 * |------------------------------|-------|---------|------|------|-------|------|
 * | message.create               |  ✓    |   ✓     |  ✓   |  ✓   |  ✓    |  ✓   |
 * | private.message.create       |       |         |  ✓   |  ✓   |  ✓    |  ✓   |
 * | interaction.create           |  ✓    |   ✓     |  ✓   |  ✓   |       |  ✓   |
 * | private.interaction.create   |       |         |  ✓   |  ✓   |       |  ✓   |
 * | message.update               |  ✓    |   ✓     |  ✓   |      |       |      |
 * | guild.join / guild.exit      |  ✓    |   ✓     |  ✓   |      |       |      |
 * | member.*  (5 种)             |  ✓    |   ✓     |  ✓   |      |       |      |
 * | notice.create                |  ✓    |   ✓     |  ✓   |      |       |      |
 * | message.delete / pin         |  ✓    |   ✓     |      |      |       |      |
 * | message.reaction.*  (2 种)   |  ✓    |   ✓     |      |      |       |      |
 * | channel.*  (3 种)            |  ✓    |   ✓     |      |      |       |      |
 * | guild.update                 |  ✓    |   ✓     |      |      |       |      |
 * | private.message.update       |       |         |  ✓   |      |       |      |
 * | private.friend.* / guild.add |       |         |  ✓   |      |       |      |
 * | private.notice.create        |       |         |  ✓   |      |       |      |
 * | private.message.delete       |       |         |      |      |       |      |
 */
export type EventBuilder<T extends EventKeys> = {
  addPlatform(params: Platform): EventBuilder<T>;
  /**
   * 批量设置自定义扩展字段，所有 key 会自动加上 `_` 前缀存储
   * 保留字段（Guild/Channel/User/Message 等）不可通过此方法设置
   */
  add<E extends Record<string, unknown>>(fields: { [K in keyof E]: K extends ReservedEventKeys ? never : E[K] }): EventBuilder<T>;
  readonly value: Events[T];
} & GuildMethods<T> &
  ChannelMethods<T> &
  UserMethods<T> &
  MessageMethods<T> &
  TextMethods<T> &
  MediaMethods<T> &
  OpenMethods<T>;
