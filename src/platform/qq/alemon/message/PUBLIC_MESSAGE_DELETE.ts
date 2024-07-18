import { APPS } from '../../../../core/index.js'
import { type EventEnum, type TypingEnum } from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'

/**
 * 公域
 * @param event
 */
export const PUBLIC_MESSAGE_DELETE = async (event: {
  message: {
    author: { bot: false; id: string; username: string }
    channel_id: string
    guild_id: string
    id: string
  }
  op_user: { id: string }
}) => {
  const masterID = ABotConfig.get('qq').masterID

  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'DELETE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.message.author.id)
      : event.message.author.id == masterID,
    attachments: [],
    specials: [],
    guild_id: event.message.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.message.channel_id,
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: event.message.id,
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: event.message.guild_id,

    //
    user_id: event.message.author.id,
    user_name: event.message.author.username,
    user_avatar: '',
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
}
