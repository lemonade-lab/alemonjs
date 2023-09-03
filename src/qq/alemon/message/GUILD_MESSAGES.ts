import { typeMessage } from 'alemon'
import { EventType, EventEnum, AMessage, PlatformEnum } from 'alemon'
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
export const GUILD_MESSAGES = async (data: any) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    event: EventEnum.MESSAGES,
    eventType: EventType.CREATE,
    /**
     * 不是私域
     */
    isPrivate: true,
    /**
     * 不是撤回
     */
    isRecall: false
  } as AMessage

  /**
   * 撤回消息
   */
  if (new RegExp(/DELETE$/).test(data.eventType)) {
    e.eventType = EventType.DELETE
    /**
     * 是撤回
     */
    e.isRecall = true
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
    return
  }

  /**
   * 消息方法
   */
  mergeMessages(e as AMessage, data).catch((err: any) => {
    console.error(err)
    return false
  })
}
