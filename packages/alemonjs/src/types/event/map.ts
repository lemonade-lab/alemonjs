import { PublicEventChannelCreate, PublicEventChannelDelete, PublicEventChannelUpdate } from './channel';
import { PublicEventGuildExit, PublicEventGuildJoin, PublicEventGuildUpdate } from './guild';
import { PrivateEventInteractionCreate, PublicEventInteractionCreate } from './interaction';
import { PublicEventMemberAdd, PublicEventMemberBan, PublicEventMemberRemove, PublicEventMemberUnban, PublicEventMemberUpdate } from './member';
import { PublicEventNoticeCreate, PrivateEventNoticeCreate } from './notice';
import {
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  PublicEventMessagePin,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  PublicEventMessageUpdate
} from './message/message';

import { PrivateEventMessageCreate, PrivateEventMessageDelete, PrivateEventMessageUpdate } from './message/private.message';

import { PrivateEventRequestFriendAdd, PrivateEventRequestFriendRemove, PrivateEventRequestGuildAdd } from './request';

import { AutoFields } from './base/auto';

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
};

/**
 * 完整事件类型（消费者接收的类型）
 * 自动包含 AutoFields（CreateAt、DeviceId 等由框架注入的字段）
 */
export type Events = {
  [K in keyof RawEvents]: RawEvents[K] & AutoFields;
};

// 携带有消息体的
export type EventsMessageCreate = Pick<Events, 'message.create' | 'private.message.create' | 'interaction.create' | 'private.interaction.create'>;

export type EventsMessageCreateKeys = keyof EventsMessageCreate;

export type EventsMessageCreateEnum = Events[EventsMessageCreateKeys];

export type EventKeys = keyof Events;

export type EventsEnum = Events[EventKeys];
