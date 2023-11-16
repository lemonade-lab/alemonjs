import { Event } from '../../sdk/types.js'
import { getBotConfigByKey } from '../../../config/index.js'
import {
  EventEnum,
  EventType,
  InstructionMatching,
  PlatformEnum
} from '../../../core/index.js'
import { getBotMsgByONE } from '../bot.js'
import { segmentONE } from '../segment.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { directController } from '../direct.js'
/**
 * 私信事件
 * @param socket
 * @param event
 * @returns
 */
export async function DIRECT_MESSAGE(event: Event) {
  const cfg = getBotConfigByKey('one')
  const masterID = cfg.masterID

  const Message = ClientController()
  const Member = ClientControllerOnMember()

  const e = {
    platform: 'one' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute:
      event.detail_type == 'private'
        ? 'single'
        : ('group' as 'group' | 'single'),
    bot: getBotMsgByONE(),
    isMaster: event.user_id == masterID,
    guild_id: '',
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    attachments: [],
    specials: [],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_txt: event.raw_message,
    msg: event.raw_message.trim(),
    msg_id: event.message_id,
    //
    user_id: event.user_id,
    user_avatar:
      event.platform == 'qq'
        ? `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`
        : 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    user_name: event.sender.nickname,
    send_at: new Date().getTime(),
    segment: segmentONE,
    Message,
    /**
     * 消息发送机制
     * @param msg 消息
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {
      return await directController(msg, event.detail_type, event.user_id)
    },
    Member
  }

  /**
   * 存在at
   */
  if (e.at) {
    /**
     * 得到第一个艾特
     */
    e.at_user = e.at_users.find(item => item.bot != true)
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
