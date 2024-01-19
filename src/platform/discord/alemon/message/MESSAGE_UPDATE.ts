import {
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption,
  type UserType
} from '../../../../core/index.js'
import { APPS } from '../../../../core/index.js'
import { ABotConfig } from '../../../../config/index.js'

import { BotMessage } from '../bot.js'
import { segmentDISCORD } from '../segment.js'
import { replyController } from '../reply.js'
import { ClientDISOCRD } from '../../sdk/index.js'

/**
 * 消息更新
 * @param event
 */
export async function MESSAGE_UPDATE(event: {
  type: number
  tts: boolean
  timestamp: string
  pinned: boolean
  mentions: any[]
  mention_roles: string[]
  mention_everyone: boolean
  member: {
    roles: string[]
    premium_since: null
    pending: boolean
    nick: null
    mute: boolean
    joined_at: string
    flags: number
    deaf: boolean
    communication_disabled_until: null
    avatar: null
  }
  id: string
  flags: number
  embeds: {
    type: string
    title: string
    image: any
    description: ''
    color: number
  }[]
  edited_timestamp: string
  content: string
  components: { type: number; components: any }[]
  channel_id: string
  author: {
    username: string
    public_flags: number
    premium_type: number
    id: string
    global_name: null
    discriminator: string
    bot: true
    avatar_decoration_data: null
    avatar: string
  }
  attachments: any[]
  guild_id: string
}) {
  if (event.author?.bot) return

  const cfg = ABotConfig.get('discord')
  const masterID = cfg.masterID

  /**
   * 艾特消息处理
   */
  const at_users: UserType[] = []

  /**
   * 清除 @ 相关
   */
  let msg = event.content

  /**
   * 艾特处理
   */
  let at = false
  let at_user: UserType | undefined = undefined

  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'UPDATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.author.id)
      : event.author?.id == masterID,
    attachments: event?.attachments ?? [],
    specials: [],
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.channel_id,
    //
    at: at,
    at_user: at_user,
    at_users: at_users,
    msg_id: event.id,
    msg_txt: event.content,
    msg: msg,
    quote: '',
    open_id: '',
    //
    user_id: event.author?.id ?? '',
    user_name: event.author?.username ?? '',
    user_avatar: ClientDISOCRD.userAvatar(
      event.author?.id,
      event.author?.avatar
    ),
    segment: segmentDISCORD,
    send_at: new Date(event.timestamp).getTime(),
    /**
     * 发送消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.open_id != '') {
        return false
      }
      const channel_id = select?.channel_id ?? event.channel_id
      return await replyController(msg, channel_id, {
        quote: select?.quote,
        withdraw
      })
    }
  }

  APPS.responseEventType(e)
  return
}
