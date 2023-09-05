import { typeMessage, AMessage } from 'alemon'
import { getBotMsgByQQ } from '../bot.js'

/**
 * DO
 */

/**
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
export const GUILD_MESSAGE_REACTIONS = async (event: any) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'GUILD_MESSAGE_REACTIONS',
    eventType: 'CREATE',
    isPrivate: true,
    isRecall: false,
    isGroup: false
  } as AMessage

  if (new RegExp(/REMOVE$/).test(event.eventType)) {
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
