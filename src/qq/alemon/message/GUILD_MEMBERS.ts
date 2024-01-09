import {
  APPS,
  type TypingEnum,
  type EventEnum,
  type MessageBingdingOption
} from '../../../core/index.js'

import { segmentQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { Controllers } from '../controller.js'
import { BOTCONFIG } from '../../../config/index.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'

interface EventGuildMembersType {
  eventType: 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBER_REMOVE'
  eventId: string
  msg: {
    guild_id: string
    joined_at: string
    nick: string
    op_user_id: string
    roles: string[]
    source_type?: string // 加入时就会有
    user: {
      avatar: string
      bot: number
      id: string
      username: string
    }
  }
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
export const GUILD_MEMBERS = async (event: EventGuildMembersType) => {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const cfg = BOTCONFIG.get('qq')
  const masterID = cfg.masterID

  const e = {
    platform: 'qq',
    event: 'GUILD_MEMBERS' as (typeof EventEnum)[number],
    typing: new RegExp(/ADD$/).test(event.eventType)
      ? 'CREATE'
      : new RegExp(/UPDATE$/).test(event.eventType)
      ? 'UPDATE'
      : ('DELETE' as (typeof TypingEnum)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: masterID == event.msg.user.id,
    attachments: [],
    specials: [],
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    quote: '',
    open_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_txt: '',
    msg_id: event.msg.guild_id,
    //
    user_id: event.msg.user.id,
    user_name: event.msg.user.username,
    user_avatar: event.msg.user.avatar,
    segment: segmentQQ,
    send_at: new Date(event.msg.joined_at).getTime(),
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
      const msg_id = select?.msg_id ?? false
      const withdraw = select?.withdraw ?? 0
      if (!msg_id) return false
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: event.msg.user.id
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
