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
export type AEventsMsg = {
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
} & AEventsMsg

declare global {
  var logger: {
    /**
     *痕迹
     * @param arg
     */
    trace(...arg: LogType[]): any
    /**
     *调试
     * @param arg
     */
    debug(...arg: LogType[]): any
    /**
     *信息
     * @param arg
     */
    info(...arg: LogType[]): any
    /**
     *警告
     * @param arg
     */
    warn(...arg: LogType[]): any
    /**
     *错误
     * @param arg
     */
    error(...arg: LogType[]): any
    /**
     *致命
     * @param arg
     */
    fatal(...arg: LogType[]): any
    /**
     *标记
     * @param arg
     */
    mark(...arg: LogType[]): any
  }
}
