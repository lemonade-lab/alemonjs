import { typeMessage, AMessage } from '../../../core/index.js'
import { mergeMessages } from './MESSAGE.js'
import { getBotMsgByQQ } from '../bot.js'

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
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'MESSAGES',
    eventType: 'CREATE',
    isPrivate: true,
    isRecall: false,
    isGroup: true
  } as AMessage

  /**
   * 撤回消息
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.eventType = 'DELETE'
    e.isRecall = true
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
    return
  }

  /**
   * 消息方法
   */
  mergeMessages(e as AMessage, event).catch((err: any) => {
    console.error(err)
    return false
  })
}
