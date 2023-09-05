import { typeMessage, AMessage } from 'alemon'
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
export const PUBLIC_GUILD_MESSAGES = async (event: EventData) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'MESSAGES',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: true // 群聊
  } as AMessage

  /**
   * 消息撤回
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
   * 消息创建
   */
  if (new RegExp(/CREATE$/).test(event.eventType)) {
    mergeMessages(e as AMessage, event).catch((err: any) => {
      console.error(err)
      return false
    })
    return
  }
}
