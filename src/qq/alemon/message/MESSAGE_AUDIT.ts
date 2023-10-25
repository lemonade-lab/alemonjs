import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import { typeMessage, AMessage } from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'

/**
 * DO
 */

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
export const MESSAGE_AUDIT = async (event: any) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'MESSAGE_AUDIT',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    boundaries: 'publick',
    attribute: 'group'
  } as AMessage

  /**
   * 事件匹配
   */
  e.event = 'MESSAGE_AUDIT'
  if (new RegExp(/REJECT$/).test(event.eventType)) {
    e.eventType = 'DELETE'
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
