import { typeMessage } from 'alemon'
import { EventEnum, EventType, AMessage, PlatformEnum } from 'alemon'
import { mergeMessages } from './MESSAGE.js'
import { EventData } from '../types.js'
import { getBotMsgByQQ } from '../bot.js'

/**
 * *
 * 公域
 * *
 */

/**
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
export const PUBLIC_GUILD_MESSAGES = async (data: EventData) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    event: EventEnum.MESSAGES,
    eventType: EventType.CREATE,
    /**
     * 不是私域
     */
    isPrivate: false,
    /**
     * 不是撤回
     */
    isRecall: false
  }

  if (new RegExp(/DELETE$/).test(data.eventType)) {
    e.eventType = EventType.DELETE
    e.isRecall = true
    /**
     * 只匹配类型
     */
    await typeMessage(e as AMessage)
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
   *
   */
  if (new RegExp(/CREATE$/).test(data.eventType)) {
    mergeMessages(e as AMessage, data).catch((err: any) => {
      console.error(err)
      return false
    })
    return
  }
}
