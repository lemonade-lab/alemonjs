import { MESSAGES } from './message/MESSAGES.js'
import { MEMBERS } from './message/MEMBERS.js'
import { REACTIONS } from './message/REACTIONS.js'
import { MESSAGE_AUDIT } from './message/MESSAGE_AUDIT.js'
import { BOT } from './message/BOT.js'
import { INTERACTION } from './message/INTERACTION.js'

/**
 * 事件处理集
 */
const ConversationMap = {
  /**
   * 房间消息--成员进入
   */
  [1]: MEMBERS,
  /**
   * 会话消息
   */
  [2]: MESSAGES,
  /**
   * 别野消息--机器人进入
   */
  [3]: BOT,
  /**
   * 别野消息--机器人退出
   */
  [4]: BOT,
  /**
   *  表情表态
   */
  [5]: REACTIONS,
  /**
   *  审核事件
   */
  [6]: MESSAGE_AUDIT,
  /**
   * 按钮回调
   */
  [7]: INTERACTION
}
/**
 * 消息接收入口
 * @param req
 * @param res
 */
export async function conversation(event: any) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
  if (!Object.prototype.hasOwnProperty.call(ConversationMap, event.type)) return
  ConversationMap[event.type](event)
}
