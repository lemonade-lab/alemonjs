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
 * GUILD 频道
 * CHANNEL 子频道
 */

interface EventChannelType {
  eventType: string
  eventId: string
  msg: {
    application_id?: string // 创建时
    guild_id: string // 频道id
    id: string
    name: string // 频道name
    op_user_id: string
    owner_id: string
    parent_id?: string // 创建时
    permissions?: string // 创建时
    position?: number // 创建时
    private_type: number
    speak_permission: number
    sub_type: number
    type: number
  }
}

/**
GUILDS (1 << 0)

  - GUILD_CREATE           // 当机器人加入新guild时
  - GUILD_UPDATE           // 当guild资料发生变更时
  - GUILD_DELETE           // 当机器人退出guild时
  - 
  - CHANNEL_CREATE         // 当channel被创建时
  - CHANNEL_UPDATE         // 当channel被更新时
  - CHANNEL_DELETE         // 当channel被删除时
 */

export const CHANNEL = async (event: EventChannelType) => {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const con = new Controllers({
    guild_id: event.msg.guild_id
  })

  const e = {
    platform: 'qq',
    event: new RegExp(/^GUILD.*$/).test(event.eventType)
      ? 'GUILD'
      : ('CHANNEL' as (typeof EventEnum)[number]),
    typing: new RegExp(/CREATE$/).test(event.eventType)
      ? 'CREATE'
      : new RegExp(/UPDATE$/).test(event.eventType)
      ? 'UPDATE'
      : ('DELETE' as (typeof TypingEnum)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.msg?.guild_id, // ?
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
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
      const channel_id = select?.channel_id ?? false
      if (!channel_id) return false
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    },
    Message: con.Message,
    Member: con.Member
  }

  /**
   * 只匹配类型
   */
  return await RESPONSE.event(e)
    .then(() => AlemonJSEventLog(e.event, e.typing))
    .catch(err => AlemonJSEventError(err, e.event, e.typing))
}
