import { typeMessage, AMessage } from '../../../alemon/index.js'
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

  await typeMessage(e)
    .then(() => {
      console.info(`\n[${e.event}] [${e.eventType}] [${true}]`)
      return true
    })
    .catch(err => {
      console.error(err)
      console.error(`\n[${e.event}] [${e.eventType}] [${false}]`)
      return false
    })
}
