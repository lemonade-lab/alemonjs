import {
  InstructionMatching,
  PlatformEnum,
  EventEnum,
  EventType,
  MessageBingdingOption
} from '../../../core/index.js'
import { EventData } from '../../sdk/index.js'
import { segmentKOOK } from '../segment.js'
import { getBotMsgByKOOK } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import {
  ClientDirectController,
  ClientControllerOnMember,
  directController
} from '../direct.js'

/**
 * @param event
 * @returns
 */
export const DIRECT_MESSAGE = async (event: EventData) => {
  if (event.extra.author.bot) return false

  const open_id = event.extra.code

  const cfg = getBotConfigByKey('kook')
  const masterID = cfg.masterID

  const avatar = event.extra.author.avatar

  // 私聊中 控制器并非私聊接口
  const Message = ClientDirectController({
    msg_id: event?.msg_id,
    open_id: open_id
  })

  const Member = ClientControllerOnMember()

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
    isMaster: event.msg_id == masterID,
    guild_id: event.target_id, // 频道号
    guild_name: '',
    guild_avatar: '',
    channel_name: event.extra.channel_name,
    channel_id: '', // 子频道
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg: event.content,
    msg_txt: event.content,
    msg_id: event.msg_id,
    open_id: event.extra.code,
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
      const open_id = select?.open_id ?? event.extra.code
      const msg_id = select?.msg_id ?? event.msg_id
      return await directController(msg, msg_id, open_id)
    }
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
