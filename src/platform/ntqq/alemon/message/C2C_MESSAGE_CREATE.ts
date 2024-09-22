import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { segmentNTQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { USER_DATA } from '../types.js'
import { ABotConfig } from '../../../../config/index.js'

export const C2C_MESSAGE_CREATE = async (event: USER_DATA) => {
  const { appID, masterID } = ABotConfig.get('ntqq')
  const open_id = event.author.user_openid
  const e = {
    platform: 'ntqq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'single' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.author.id)
      : event.author.id == masterID,
    channel_id: event.author.user_openid,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    guild_id: event.author.user_openid,
    attachments: [],
    specials: [],
    //
    at_users: [],
    at_user: undefined,
    at: false,
    msg_txt: event.content,
    msg: event.content,
    msg_id: event.id,
    quote: '',
    open_id: open_id,
    //
    user_id: event.author.id,
    user_name: '无',
    user_avatar: `https://q.qlogo.cn/qqapp/${appID}/${event.author.id}/640`,
    segment: segmentNTQQ,
    send_at: new Date().getTime()
  }
  APPS.response(e)
  APPS.responseMessage(e)
  return
}
