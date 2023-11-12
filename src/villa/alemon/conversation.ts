import { MESSAGES_VILLA } from './message/MESSAGES.js'
import { GUILD_MEMBERS_VILLA } from './message/GUILD_MEMBERS.js'
import { GUILD_MESSAGE_REACTIONS_VILLA } from './message/GUILD_MESSAGE_REACTIONS.js'
import { MESSAGE_AUDIT_VILLA } from './message/MESSAGE_AUDIT.js'
import { GUILDS_VILLA } from './message/GUILDS.js'
/**
 * 事件处理集
 */
const ConversationMap = {
  /**
   * 房间消息--成员进出
   */
  [1]: GUILD_MEMBERS_VILLA,
  /**
   * 会话消息
   */
  [2]: MESSAGES_VILLA,
  /**
   * 别野消息--机器人进入
   */
  [3]: GUILDS_VILLA,
  /**
   * 别野消息--机器人退出
   */
  [4]: GUILDS_VILLA,
  /**
   *  表情表态
   */
  [5]: GUILD_MESSAGE_REACTIONS_VILLA,
  /**
   *  审核事件
   */
  [6]: MESSAGE_AUDIT_VILLA
}
/**
 * 消息接收入口
 * @param req
 * @param res
 */
export async function callBackByVilla(event) {
  if (Object.prototype.hasOwnProperty.call(ConversationMap, event.type)) {
    return await ConversationMap[event.type](event)
  }
}
