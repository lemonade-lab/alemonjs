import {
  typeMessage,
  AMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { mergeMessages } from './MESSAGE.js'
import { getBotMsgByQQ } from '../bot.js'
import {
  everyoneError,
  AlemonJSEventError,
  AlemonJSEventLog
} from '../../../log/index.js'
import { segmentQQ } from '../segment.js'

/**
 * *私域*
 */

/** 
GUILD_MESSAGES (1 << 9)    // 消息事件，仅 *私域* 机器人能够设置此 intents。
  - MESSAGE_CREATE         
  // 频道内的全部消息，
  而不只是 at 机器人的消息。
  内容与 AT_MESSAGE_CREATE 相同
  - MESSAGE_DELETE         // 删除（撤回）消息事件
 * */
export const GUILD_MESSAGES = async (event: any) => {
  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isPrivate: true,
    isRecall: false,
    isGroup: true,
    attachments: event?.msg?.attachments ?? [],
    specials: [],
    user_id: '',
    user_name: '',
    isMaster: false,
    send_at: new Date().getTime(),
    user_avatar: '',
    at: false,
    msg_id: '',
    msg_txt: '',
    segment: segmentQQ,
    msg: '',
    at_user: undefined,
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    at_users: [],
    /**
     * 发现消息
     * @param msg
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
    ): Promise<any> => {},
    withdraw: async (select?: {
      guild_id?: string
      channel_id?: string
      msg_id?: string
      send_at?: number
    }) => {}
  }

  /**
   * 撤回消息
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.eventType = 'DELETE'
    e.isRecall = true

    e.boundaries = 'publick'
    e.attribute = 'group'
    /**
     * 只匹配类型
     */
    return await typeMessage(e)
      .then(() => AlemonJSEventLog(e.event, e.eventType))
      .catch(err => AlemonJSEventError(err, e.event, e.eventType))
  }

  /**
   * 消息方法
   */
  mergeMessages(e as AMessage, event).catch(everyoneError)
}
