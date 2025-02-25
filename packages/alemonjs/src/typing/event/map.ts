import { PublicEventChannalCreate, PublicEventChannalDelete } from './channal'
import { PublicEventGuildExit, PublicEventGuildJoin } from './guild'
import { PublicEventMemberAdd, PublicEventMemberRemove } from './member'
import {
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  PublicEventMessageUpdate
} from './message/message'

import {
  PrivateEventMessageCreate,
  PrivateEventMessageDelete,
  PrivateEventMessageUpdate
} from './message/private.message'

import { PrivateEventRequestFriendAdd, PrivateEventRequestGuildAdd } from './request'

// 携带有消息体的
export type EventsMessageCreate = {
  'message.create': PublicEventMessageCreate
  'private.message.create': PrivateEventMessageCreate
}

export type EventsMessageCreateEnum = Events[keyof EventsMessageCreate]

export type Events = {
  'message.update': PublicEventMessageUpdate
  'message.delete': PublicEventMessageDelete
  'message.reaction.add': PublicEventMessageReactionAdd
  'message.reaction.remove': PublicEventMessageReactionRemove
  'channal.create': PublicEventChannalCreate
  'channal.delete': PublicEventChannalDelete
  'guild.join': PublicEventGuildJoin
  'guild.exit': PublicEventGuildExit
  'member.add': PublicEventMemberAdd
  'member.remove': PublicEventMemberRemove
  'private.message.update': PrivateEventMessageUpdate
  'private.message.delete': PrivateEventMessageDelete
  'private.friend.add': PrivateEventRequestFriendAdd
  'private.guild.add': PrivateEventRequestGuildAdd
} & EventsMessageCreate

export type EventsEnum = Events[keyof Events]

export const EventsKeyEnum: (keyof Events)[] = [
  'message.create',
  'message.update',
  'message.delete',
  'message.reaction.add',
  'message.reaction.remove',
  'private.message.create',
  'private.message.update',
  'private.message.delete',
  'private.friend.add',
  'private.guild.add',
  'channal.create',
  'channal.delete',
  'guild.join',
  'guild.exit',
  'member.add',
  'member.remove'
] as const
