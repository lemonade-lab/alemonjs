import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  RESPONSE,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'
import { Controllers } from '../controller.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'

/**
 * TUDO
 */

/**
INTERACTION (1 << 26)
  - INTERACTION_CREATE     // 互动事件创建时
 */
export const INTERACTION = async event => {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const con = new Controllers({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id
  })

  const e = {
    platform: 'qq',
    event: 'INTERACTION' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: '',
    msg_txt: '',
    quote: '',
    open_id: event.msg.guild_id,

    //
    user_id: '',
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
      const msg_id = select?.msg_id ?? event.msg.id
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.user_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: select?.user_id
        })
      }
      const channel_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    },
    Message: con.Message,
    Member: con.Member
  }

  /**
   * 事件匹配
   */
  if (!new RegExp(/CREATE$/).test(event.eventType)) {
    e.typing = 'DELETE'
  }

  return await RESPONSE.event(e)
    .then(() => AlemonJSEventLog(e.event, e.typing))
    .catch(err => AlemonJSEventError(err, e.event, e.typing))
}
