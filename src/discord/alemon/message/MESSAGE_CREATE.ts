import {
  type EventEnum,
  type TypingEnum,
  InstructionMatching,
  type MessageBingdingOption,
  type UserType
} from '../../../core/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { BOTCONFIG } from '../../../config/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { getBotMsgByDISCORD } from '../bot.js'
import { segmentDISCORD } from '../segment.js'
import { replyController } from '../reply.js'
import { ClientDISOCRD } from '../../sdk/index.js'

interface MESSAGES_TYPE {
  type: number
  tts: boolean
  timestamp: string
  referenced_message: null
  pinned: boolean
  nonce: string
  mentions: {
    username: string
    public_flags: number
    member: any
    id: string
    global_name: null
    discriminator: string
    bot: boolean
    avatar_decoration_data: null
    avatar: string
  }[]
  mention_roles: any[]
  mention_everyone: boolean
  member: {
    roles: any[]
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
  embeds: any[]
  edited_timestamp: null
  content: string
  components: any[]
  channel_id: string
  author: {
    username: string
    public_flags: number
    premium_type: number
    id: string
    global_name: string
    discriminator: string
    avatar_decoration_data: null
    avatar: string
    bot?: boolean
  }
  attachments: any[]
  guild_id: string
}
/**
 * 基础消息
 * @param event
 */
export async function MESSAGE_CREATE(event: MESSAGES_TYPE) {
  if (event.author?.bot) return

  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const Message = ClientController({
    guild_id: event.guild_id,
    channel_id: event.channel_id,
    msg_id: event.id,
    user_id: event.author?.id ?? ''
  })

  const Member = ClientControllerOnMember({
    guild_id: event.guild_id,
    channel_id: event.channel_id,
    user_id: event.author?.id ?? ''
  })

  const cfg = BOTCONFIG.get('discord')
  const masterID = cfg.masterID

  /**
   * 艾特消息处理
   */
  const at_users: UserType[] = []

  /**
   * 切割
   */
  for (const item of event.mentions) {
    at_users.push({
      id: item.id,
      name: item.username,
      avatar: ClientDISOCRD.UserAvatar(item.id, item.avatar),
      bot: item.bot
    })
  }

  /**
   * 清除 @ 相关
   */
  let msg = event.content
  for await (const item of at_users) {
    msg = msg.replace(`<@${item.id}>`, '').trim()
  }

  /**
   * 艾特处理
   */
  let at = false
  let at_user: UserType | undefined = undefined
  if (at_users.some(item => item.bot != true)) {
    at = true
  }
  if (at) {
    at_user = at_users.find(item => item.bot != true)
  }

  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByDISCORD(),
    isMaster: event.author?.id == masterID,
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
    user_avatar: ClientDISOCRD.UserAvatar(
      event.author?.id,
      event.author?.avatar
    ),
    segment: segmentDISCORD,
    send_at: new Date(event.timestamp).getTime(),
    Message,
    Member,
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
      const msg_id = select?.msg_id ?? event.id
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

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
