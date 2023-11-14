import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'

interface GUILD_MESSAGE_REACTIONS {
  eventType: 'MESSAGE_REACTION_ADD' | 'MESSAGE_REACTION_REMOVE'
  eventId: string
  msg: {
    channel_id: string
    emoji: { id: string; type: number }
    guild_id: string
    target: {
      id: string
      type: string
    }
    user_id: string
  }
}

/**
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
export const GUILD_MESSAGE_REACTIONS = async (
  event: GUILD_MESSAGE_REACTIONS
) => {
  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    eventType: new RegExp(/ADD$/).test(event.eventType)
      ? 'CREATE'
      : ('DELETE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isPrivate: true,
    isRecall: false,
    isGroup: false,
    attachments: [],
    specials: [
      {
        emoticon_id: event.msg.emoji.id,
        emoticon_type: event.msg.emoji.type,
        emoticon: '',
        is_cancel: new RegExp(/ADD$/).test(event.eventType) ? true : false,
        msg_uid: ''
      }
    ],
    user_id: event.msg.user_id,
    user_name: '',
    isMaster: false,
    send_at: new Date().getTime(),
    user_avatar: '',
    at: false,
    msg_id: event.msg.target.id,
    msg_txt: '',
    at_user: undefined,
    segment: segmentQQ,
    msg: '',
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    at_users: [],
    /**
     * 发现消息
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
    }) => {}
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
