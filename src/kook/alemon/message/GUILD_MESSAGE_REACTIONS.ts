import {
  InstructionMatching,
  type PlatformEnum,
  type EventEnum,
  type EventType,
  type MessageBingdingOption
} from '../../../core/index.js'
import {
  ClientKOOK,
  type StatementData,
  type SystemData
} from '../../sdk/index.js'
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
export const GUILD_MESSAGE_REACTIONS = async (event: SystemData) => {
  const body = event.extra.body as StatementData

  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const cfg = getBotConfigByKey('kook')
  const masterID = cfg.masterID

  const Message = ClientController({
    channel_id: event.target_id, // 子频道
    msg_id: event.msg_id,
    user_id: body.user_id
  })

  const Member = ClientControllerOnMember({
    guild_id: event.target_id, // 频道
    user_id: body.user_id
  })

  const data = await ClientKOOK.userChatCreate(body.user_id).then(
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
    isMaster: body.user_id == masterID ? true : false,
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
    open_id: data?.code ?? '', // 私聊标记 空的 需要创建私聊 每次请求都自动创建
    //
    user_id: body.user_id,
    user_name: '',
    user_avatar: '',
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
      if (select?.open_id) {
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
