import { PUBLIC_GUILD_MESSAGES_KOOK } from './message/PUBLIC_GUILD_MESSAGES.js'
import { EventData, SystemData } from '../sdk/index.js'
/**
 * 事件处理集
 */
const ConversationMap = {
  /**
   * 文字消息
   */
  [1]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * 图片消息，
   */
  [2]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * 视频消息，
   */
  [3]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * 文件消息，
   */
  [4]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * 音频消息，
   */
  [8]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * mk消息
   */
  [9]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * card消息，
   */
  [10]: PUBLIC_GUILD_MESSAGES_KOOK,
  /**
   * 系统消息
   * @param event
   */
  [255]: (event: SystemData) => {
    console.info('system message', new Date(event.msg_timestamp))
  }
}
/**
 * 消息接收入口
 * @param req
 * @param res
 */
export async function callBackByKOOK(event: EventData | SystemData) {
  if (Object.prototype.hasOwnProperty.call(ConversationMap, event.type)) {
    return await ConversationMap[event.type](event)
  }
  return false
}
