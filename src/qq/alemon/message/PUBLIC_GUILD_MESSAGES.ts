import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { mergeMessages } from './MESSAGE.js'
import { getBotMsgByQQ } from '../bot.js'
import {
  AlemonJSEventError,
  AlemonJSEventLog,
  everyoneError
} from '../../../log/index.js'
import { segmentQQ } from '../segment.js'

interface EventPublicDuildType {
  eventType: 'AT_MESSAGE_CREATE'
  eventId: string
  msg: {
    attachments?: {
      content_type: string
      filename: string
      height: number
      id: string
      size: number
      url: string
      width: number
    }[]
    author: {
      avatar: string
      bot: boolean
      id: string
      username: string
    }
    channel_id: string
    content: string
    guild_id: string
    id: string
    member: {
      joined_at: string
      nick: string
      roles: string[]
    }
    mentions: {
      avatar: string
      bot: boolean
      id: string
      username: string
    }[]
    seq: number
    seq_in_channel: string
    timestamp: string
  }
}

/**
 * *
 * 公域
 * *
 */

/**
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
export const PUBLIC_GUILD_MESSAGES = async (event: EventPublicDuildType) => {
  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isPrivate: false,
    isRecall: false,
    isGroup: true,
    attachments: event?.msg?.attachments ?? [],
    specials: [],
    user_id: '',
    user_name: '',
    isMaster: false,
    send_at: new Date().getTime(),
    user_avatar: '',
    at: false,
    msg_id: '',
    msg_txt: '',
    segment: segmentQQ,
    msg: '',
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    at_user: undefined,
    at_users: [],
    /**
     * 发送消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {},
    withdraw: async (select?: {
      guild_id?: string
      channel_id?: string
      msg_id?: string
      send_at?: number
    }) => {},
    controller: async (select?: {
      msg_id?: string
      send_at?: number
      withdraw?: number
      guild_id?: string
      channel_id?: string
      pinning?: boolean
      forward?: boolean
      horn?: boolean
    }) => {}
  }

  /**
   * 消息撤回
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.eventType = 'DELETE'
    e.isRecall = true
    return await typeMessage(e)
      .then(() => AlemonJSEventLog(e.event, e.eventType))
      .catch(err => AlemonJSEventError(err, e.event, e.eventType))
  }

  /**
   * 消息创建
   */
  if (new RegExp(/CREATE$/).test(event.eventType)) {
    mergeMessages(e, event).catch(everyoneError)
    return
  }
}
