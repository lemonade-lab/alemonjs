import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'

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
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
