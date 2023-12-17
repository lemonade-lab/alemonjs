import {
  type UserType,
  InstructionMatching,
  type PlatformEnum,
  type EventEnum,
  type EventType,
  type MessageBingdingOption
} from '../../../core/index.js'
import { ClientKOOK, type EventData } from '../../sdk/index.js'
import { segmentKOOK } from '../segment.js'
import { getBotMsgByKOOK } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { replyController } from '../reply.js'
import { directController } from '../direct.js'

/**
 *
 * @param event
 * @returns
 */
export const PUBLIC_GUILD_MESSAGES_KOOK = async (event: EventData) => {
  if (event.extra?.author?.bot) return false

  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

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

  const cfg = getBotConfigByKey('kook')
  const masterID = cfg.masterID

  const avatar = event.extra.author.avatar

  const Message = ClientController({
    channel_id: event.target_id, // 子频道
    msg_id: event.msg_id,
    user_id: event.extra.author.id
  })

  const Member = ClientControllerOnMember({
    guild_id: event.target_id, // 频道
    user_id: event.extra.author.id
  })

  const data = await ClientKOOK.userChatCreate(event.extra.author.id).then(
    res => res?.data
  )

  const e = {
    platform: 'kook' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'private' as 'publick' | 'private',
    attribute:
      event.channel_type == 'GROUP'
        ? 'group'
        : ('single' as 'group' | 'single'),
    bot: getBotMsgByKOOK(),
    isMaster: event.extra.author.id == masterID ? true : false,
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
    open_id: data?.code ?? '', // 私聊标记 空的 需要创建私聊 每次请求都自动创建
    //
    user_id: event.extra.author.id,
    user_name: event.extra.author.username,
    user_avatar: avatar.substring(0, avatar.indexOf('?')),
    segment: segmentKOOK,
    send_at: event.msg_timestamp,
    Message,
    Member,
    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const channel_id = select?.channel_id ?? event.target_id // 子频道
      if (select?.open_id && select?.open_id != '') {
        directController(msg, channel_id, select?.open_id)
        return false
      }
      return await replyController(msg, channel_id)
    }
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
