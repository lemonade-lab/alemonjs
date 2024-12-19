import { PublicEventChannalCreate, PublicEventChannalDelete } from './typing/event/channal'
import { PublicEventGuildExit, PublicEventGuildJoin } from './typing/event/guild'
import { PublicEventMemberAdd, PublicEventMemberRemove } from './typing/event/member'
import {
  PublicEventMessageCreate,
  PublicEventMessageDelete,
  PublicEventMessageReactionAdd,
  PublicEventMessageReactionRemove,
  PublicEventMessageUpdate
} from './typing/event/message/message'

import {
  PrivateEventMessageCreate,
  PrivateEventMessageDelete,
  PrivateEventMessageUpdate
} from './typing/event/message/private.message'

import { PrivateEventRequestFriendAdd, PrivateEventRequestGuildAdd } from './typing/event/request'

//
export type LogType = string | Error | unknown

// 携带有消息体的
export type AEventsMessage = {
  'message.create': PublicEventMessageCreate
  'private.message.create': PrivateEventMessageCreate
}

//
export type AEvents = {
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
} & AEventsMessage

declare global {
  var logger: {
    trace: (...args: any[]) => void
    debug: (...args: any[]) => void
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    fatal: (...args: any[]) => void
    mark: (...args: any[]) => void
  }
}
