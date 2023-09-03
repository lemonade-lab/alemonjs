import { typeMessage } from 'alemon'
import { EventEnum, EventType, AMessage, PlatformEnum } from 'alemon'
import { getBotMsgByQQ } from '../bot.js'

/**
 * DO
 */

/**
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
export const GUILD_MESSAGE_REACTIONS = async (data: any) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    event: EventEnum.GUILD_MESSAGE_REACTIONS,
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

  if (new RegExp(/REMOVE$/).test(data.eventType)) {
    e.eventType = EventType.DELETE
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
