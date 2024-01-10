import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../../core/index.js'
import { BotMessage } from '../../bot.js'
import { segmentQQ } from '../../segment.js'
import { Controllers } from '../../controller.js'
import { directController } from '../../direct.js'
import { replyController } from '../../reply.js'

/**
 * GUILD 频道
 * CHANNEL 子频道
 */

/**
 * DO
 */

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
export const GUILD = async (event: {
  eventType: string
  eventId: string
  msg: {
    description: string
    icon: string // 频道 a
    id: string // 频道 id
    joined_at: string // msg_time
    max_members: number
    member_count: number
    name: string // 频道name
    op_user_id: string
    owner: boolean
    owner_id: string
    union_appid: string
    union_org_id: string
    union_world_id: string
  }
}) => {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

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
    bot: BotMessage.get(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.msg.id,
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
    open_id: event.msg.id,

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
    Controllers
  }

  APPS.responseEventType(e)
  return
}
