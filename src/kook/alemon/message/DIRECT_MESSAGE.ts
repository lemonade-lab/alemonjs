import {
  InstructionMatching,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { EventData } from '../../sdk/index.js'
import { segmentKOOK } from '../segment.js'
import { getBotMsgByKOOK } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { ClientController } from '../controller.js'
import { directController } from '../direct.js'

/**
 * @param event
 * @returns
 */
export const DIRECT_MESSAGE = async (event: EventData) => {
  if (event.extra.author.bot) return false
  //
  const cfg = getBotConfigByKey('kook')
  const masterID = cfg.masterID

  const avatar = event.extra.author.avatar

  const Message = ClientController({
    guild_id: event.target_id,
    channel_id: event.extra.guild_id,
    msg_id: event.msg_id,
    send_at: new Date().getTime()
  })

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
    guild_id: event.target_id, // 频道
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.extra.code, // 子频道
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg: event.content,
    msg_txt: event.content,
    msg_id: event.msg_id,
    //
    user_id: event.extra.author.id,
    user_name: event.extra.author.username,
    user_avatar: avatar.substring(0, avatar.indexOf('?')),
    segment: segmentKOOK,
    send_at: event.msg_timestamp,
    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
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
      // 私的
      return await directController(msg, event.author_id, event.extra.code)
    },
    Message
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
