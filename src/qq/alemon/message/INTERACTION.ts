import { AlemonJSEventError, AlemonJSEventLog } from 'src/log/event.js'
import { typeMessage, AMessage } from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'

/**
 * DO
 */

/**
INTERACTION (1 << 26)
  - INTERACTION_CREATE     // 互动事件创建时
 */
export const INTERACTION = async event => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'INTERACTION',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: false
  } as AMessage

  /**
   * 事件匹配
   */
  if (!new RegExp(/CREATE$/).test(event.eventType)) {
    e.eventType = 'DELETE'
  }

  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
