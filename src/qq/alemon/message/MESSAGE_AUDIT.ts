import { typeMessage, AMessage } from 'alemon'
import { getBotMsgByQQ } from '../bot.js'

/**
 * DO
 */

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
export const MESSAGE_AUDIT = async (data: any) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'MESSAGE_AUDIT',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: false
  } as AMessage

  /**
   * 事件匹配
   */
  e.event = 'MESSAGE_AUDIT'
  if (new RegExp(/REJECT$/).test(data.eventType)) {
    e.eventType = 'DELETE'
  }

  /**
   * 只匹配类型
   */
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
