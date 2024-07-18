import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'

/**
 * 交互消息事件 | 按钮消息
 * @param event
 * @returns
 */
export const INTERACTION_CREATE = async event => {
  const e = {
    platform: 'qq',
    event: 'INTERACTION' as (typeof EventEnum)[number],
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
    channel_id: event.channel_id,
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: '',
    msg_txt: '',
    quote: '',
    open_id: event.guild_id,

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
