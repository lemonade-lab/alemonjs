import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType,
  MessageBingdingOption
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'

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
  const Message = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    msg_id: event.msg.target.id,
    user_id: event.msg.user_id
  })

  const Member = ClientControllerOnMember({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    user_id: event.msg.user_id
  })

  const cfg = getBotConfigByKey('qq')
  const masterID = cfg.masterID

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    eventType: new RegExp(/ADD$/).test(event.eventType)
      ? 'CREATE'
      : ('DELETE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: event.msg.user_id == masterID,
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
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
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: event.msg.target.id,
    msg_txt: '',
    open_id: event.msg.guild_id,

    //
    user_id: event.msg.user_id,
    user_name: '',
    user_avatar: '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? event.msg.target.id
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: event.msg.user_id
        })
      }
      const channel_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    },
    Message,
    Member
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
