import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import {
  ClientKOOK,
  type StatementData,
  type SystemData
} from '../../sdk/index.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'

/**
 *
 * @param event
 * @returns
 */
export const REACTIONS = async (event: SystemData) => {
  const body = event.extra.body as StatementData

  const masterID = ABotConfig.get('kook').masterID

  const data = await ClientKOOK.userChatCreate(body.user_id).then(
    res => res?.data
  )

  const e = {
    platform: 'kook',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'private' as 'publick' | 'private',
    attribute:
      event.channel_type == 'GROUP'
        ? 'group'
        : ('single' as 'group' | 'single'),
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(body.user_id)
      : body.user_id == masterID,
    guild_id: event.target_id, // 频道
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.target_id, // 子频道
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg: '',
    msg_txt: event.content,
    msg_id: event.msg_id,
    quote: '',
    open_id: data?.code ?? '', // 私聊标记 空的 需要创建私聊 每次请求都自动创建
    //
    user_id: body.user_id,
    user_name: '',
    user_avatar: '',
    send_at: event.msg_timestamp
  }
  APPS.response(e)
  APPS.responseEventType(e)
  return
}
