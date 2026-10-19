import { User } from "../types/event/base/user.js";
import { Channel, Guild } from "../types/event/base/guild.js";
import { Message, MessageMedia, MessageOpen, MessageText } from "../types/event/base/message.js";
import { Platform } from "../types/event/base/platform.js";
import { Interaction } from "../types/event/base/interaction.js";
import { EventKeys, Events } from "../types/event/map.js";
import { EventBuilder, ReservedEventKeys } from "../types/event/builder.js";
import "../types/index.js";
//#region src/platform/event-format.d.ts
/**
 * 链式构建事件对象，根据事件名约束可用方法
 * @example
 * ```ts
 * // message.create 拥有全部字段方法
 * const msg = FormatEvent.create('message.create')
 *   .addPlatform({ Platform: 'discord', value: raw })
 *   .addGuild({ GuildId: 'g1', SpaceId: 's1' })
 *   .addChannel({ ChannelId: 'c1' })
 *   .addUser({ UserId: 'u1', UserKey: 'k1', IsMaster: false, IsBot: false })
 *   .addMessage({ MessageId: 'm1' })
 *   .addText({ MessageText: 'hello' })
 *   .addMedia({ MessageMedia: [{ Type: 'image', Url: '...' }] })
 *   .addOpen({ OpenId: 'o1' })
 *   .value;
 *
 * // private.message.delete 只有 addPlatform / addMessage
 * const del = FormatEvent.create('private.message.delete')
 *   .addPlatform({ Platform: 'qq', value: raw })
 *   .addMessage({ MessageId: 'm2' })
 *   .value;
 *   // del.addGuild → 类型错误 ✓
 * ```
 */
declare class FormatEvent<T extends EventKeys = EventKeys> {
  #private;
  private constructor();
  static create<T extends EventKeys>(name: T): EventBuilder<T>;
  addPlatform(params: Platform): this;
  addGuild(params: Guild): this;
  addChannel(params: Channel): this;
  addUser(params: User): this;
  addMessage(params: Message): this;
  addText(params: MessageText): this;
  addMedia(params: MessageMedia): this;
  addOpen(params: MessageOpen): this;
  addInteraction(params: Interaction): this;
  /**
   * 批量设置自定义扩展字段（非事件保留字段）
   * 所有 key 会自动加上 `_` 前缀存储，避免与事件标准字段冲突
   * @example
   * ```ts
   * FormatEvent.create('message.create')
   *   .add<MyEvent>({ rawType: 'GROUP_AT_MESSAGE_CREATE', tag: 'xxx' })
   *   // 实际存储为 { _rawType: '...', _tag: '...' }
   * ```
   */
  add<E extends Record<string, unknown>>(fields: { [K in keyof E]: K extends ReservedEventKeys ? never : E[K]; }): this;
  get value(): Events[T];
}
/**
 * 将事件对象包装为只读代理，访问自定义字段时自动解析 `_` 前缀
 *
 * - `event.rawType`        → 实际读取 `event._rawType`
 * - `event.GuildId`        → 正常读取
 * - `'rawType' in event`   → true（如果 `_rawType` 存在）
 * - `Object.keys(event)`   → `_rawType` 映射为 `rawType`
 * - `event.rawType = 'x'`  → 抛出 TypeError（只读）
 *
 * @example
 * ```ts
 * const raw = FormatEvent.create('message.create')
 *   .add<MyEvent>({ rawType: 'GROUP_AT_MESSAGE_CREATE' })
 *   .value;
 *
 * const event = wrapEvent<MyEvent>(raw);
 * event.rawType;   // 'GROUP_AT_MESSAGE_CREATE'
 * ```
 */
declare function wrapEvent<E extends Record<string, unknown>>(event: object): Readonly<E>;
//#endregion
export { FormatEvent, wrapEvent };