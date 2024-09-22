import {
  type EventEnum,
  type TypingEnum,
  APPS
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'

/**
 * 子频道
 * @param event
 */
export async function CHANNEL_TOPIC_UPDATE(event: {
  topic: null
  id: string
  guild_id: string
}) {
  const e = {
    platform: 'qq',
    event: 'CHANNEL' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: event.id,
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: '',

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
