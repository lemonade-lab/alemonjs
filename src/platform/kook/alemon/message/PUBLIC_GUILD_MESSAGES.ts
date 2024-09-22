import { APPS } from '../../../../core/index.js'
import {
  type UserType,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { type EventData } from '../../sdk/index.js'
import { ClientKOOK } from '../../sdk/index.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'

/**
 * 群聊消息
 * @param event
 * @returns
 */
export const PUBLIC_GUILD_MESSAGES_KOOK = async (event: EventData) => {
  if (event.extra?.author?.bot) return false

  let at = false
  const at_users: UserType[] = []
  let msg = event?.extra?.kmarkdown?.raw_content ?? event.content
  /**
   * 艾特类型所得到的
   * 包括机器人在内
   */
  const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
  for await (const item of mention_role_part) {
    at = true
    at_users.push({
      id: item.role_id,
      name: item.name,
      avatar: '',
      bot: true
    })
    msg = msg.replace(`(rol)${item.role_id}(rol)`, '').trim()
  }
  /**
   * 艾特用户所得到的
   */
  const mention_part = event.extra.kmarkdown?.mention_part ?? []
  for await (const item of mention_part) {
    at = true
    at_users.push({
      id: item.id,
      name: item.username,
      avatar: item.avatar,
      bot: false
    })
    msg = msg.replace(`(met)${item.id}(met)`, '').trim()
  }
  let at_user = undefined
  if (at) {
    if (at_users[0] && at_users[0].bot != true) {
      at_user = at_users[0]
    }
  }

  const masterID = ABotConfig.get('kook').masterID

  const avatar = event.extra.author.avatar

  const data = await ClientKOOK.userChatCreate(event.extra.author.id).then(
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
      ? masterID.includes(event.extra.author.id)
      : event.extra.author.id == masterID,
    guild_id: event.extra.guild_id, // 频道
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.target_id, // 子频道
    attachments: [],
    specials: [],
    //
    at,
    at_users,
    at_user,
    msg,
    msg_txt: event?.extra?.kmarkdown?.raw_content ?? event.content,
    msg_id: event.msg_id,
    quote: '',
    open_id: data?.code ?? '', // 私聊标记 空的 需要创建私聊 每次请求都自动创建
    //
    user_id: event.extra.author.id,
    user_name: event.extra.author.username,
    user_avatar: avatar.substring(0, avatar.indexOf('?')),
    send_at: event.msg_timestamp
  }
  APPS.response(e)
  APPS.responseMessage(e)
  return
}
