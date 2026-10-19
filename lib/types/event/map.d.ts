import { PublicEventChannelCreate, PublicEventChannelDelete, PublicEventChannelUpdate } from "./channel/index.js";
import { PublicEventGuildExit, PublicEventGuildJoin, PublicEventGuildUpdate } from "./guild/index.js";
import { PrivateEventInteractionCreate, PublicEventInteractionCreate } from "./interaction/index.js";
import { PublicEventMemberAdd, PublicEventMemberBan, PublicEventMemberRemove, PublicEventMemberUnban, PublicEventMemberUpdate } from "./member/index.js";
import { PrivateEventNoticeCreate, PublicEventNoticeCreate } from "./notice/index.js";
import { PublicEventMessageCreate, PublicEventMessageDelete, PublicEventMessagePin, PublicEventMessageReactionAdd, PublicEventMessageReactionRemove, PublicEventMessageUpdate } from "./message/message.js";
import { PrivateEventMessageCreate, PrivateEventMessageDelete, PrivateEventMessageUpdate } from "./message/private.message.js";
import { PrivateEventRequestFriendAdd, PrivateEventRequestFriendRemove, PrivateEventRequestGuildAdd } from "./request/index.js";
import { AutoFields } from "./base/auto.js";
import { PlatformConnectionReadyEvent, PlatformLoginQRCodeEvent, PlatformLoginSuccessEvent } from "../connection.js";
//#region src/types/event/map.d.ts
/**
 * 原始事件定义（平台适配器构造的类型）
 * 不含框架自动注入字段
 */
type RawEvents = {
  'message.create': PublicEventMessageCreate;
  'private.message.create': PrivateEventMessageCreate;
  'interaction.create': PublicEventInteractionCreate;
  'private.interaction.create': PrivateEventInteractionCreate;
  'message.update': PublicEventMessageUpdate;
  'message.delete': PublicEventMessageDelete;
  'message.reaction.add': PublicEventMessageReactionAdd;
  'message.reaction.remove': PublicEventMessageReactionRemove;
  'message.pin': PublicEventMessagePin;
  'channel.create': PublicEventChannelCreate;
  'channel.delete': PublicEventChannelDelete;
  'channel.update': PublicEventChannelUpdate;
  'guild.join': PublicEventGuildJoin;
  'guild.exit': PublicEventGuildExit;
  'guild.update': PublicEventGuildUpdate;
  'member.add': PublicEventMemberAdd;
  'member.remove': PublicEventMemberRemove;
  'member.ban': PublicEventMemberBan;
  'member.unban': PublicEventMemberUnban;
  'member.update': PublicEventMemberUpdate;
  'notice.create': PublicEventNoticeCreate;
  'private.message.update': PrivateEventMessageUpdate;
  'private.message.delete': PrivateEventMessageDelete;
  'private.friend.add': PrivateEventRequestFriendAdd;
  'private.friend.remove': PrivateEventRequestFriendRemove;
  'private.guild.add': PrivateEventRequestGuildAdd;
  'private.notice.create': PrivateEventNoticeCreate;
  'login.qrcode': PlatformLoginQRCodeEvent;
  'login.success': PlatformLoginSuccessEvent;
  'connection.ready': PlatformConnectionReadyEvent;
};
/**
 * 完整事件类型（消费者接收的类型）
 * 自动包含 AutoFields（CreateAt、DeviceId 等由框架注入的字段）
 */
type Events = { [K in keyof RawEvents]: RawEvents[K] & AutoFields; };
type EventsMessageCreate = Pick<Events, 'message.create' | 'private.message.create' | 'interaction.create' | 'private.interaction.create'>;
type EventsMessageCreateKeys = keyof EventsMessageCreate;
type EventsMessageCreateEnum = Events[EventsMessageCreateKeys];
type EventKeys = keyof Events;
type EventsEnum = Events[EventKeys];
//#endregion
export { EventKeys, Events, EventsEnum, EventsMessageCreate, EventsMessageCreateEnum, EventsMessageCreateKeys };