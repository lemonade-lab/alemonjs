import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../core/index.js'
import { segmentQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../config/index.js'
import { Controllers, directController } from '../direct.js'

/**
 * *
 * 私信
 * *
 */
export const DIRECT_MESSAGE_DELETE = async (event: {
  message: {
    author: { bot: boolean; id: string; username: string }
    channel_id: string
    direct_message: boolean
    guild_id: string
    id: string
    src_guild_id: string
  }
  op_user: { id: string }
}) => {
  const open_id = event.message?.guild_id

  const masterID = ABotConfig.get('qq').masterID
  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'DELETE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'single' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.message.author.id)
      : event.message.author.id == masterID,
    guild_id: event.message.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.message.channel_id,
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg: '',
    msg_txt: '',
    msg_id: event.message.id,
    quote: '',
    open_id: open_id,
    //
    user_id: event.message.author.id,
    user_name: event.message.author.username,
    user_avatar: '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const open_id = select?.open_id ?? event.message.guild_id
      const msg_id = select?.msg_id ?? event.message.id
      const withdraw = select?.withdraw ?? 0
      return await directController(msg, open_id, msg_id, {
        withdraw
      })
    },
    Controllers
  }

  APPS.responseEventType(e)
  return
}
