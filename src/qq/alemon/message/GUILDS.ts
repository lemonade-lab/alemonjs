import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import { typeMessage, AMessage } from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'

/**
 * GUILD 频道
 * CHANNEL 子频道
 */

/**
 * DO
 */

/**
GUILDS (1 << 0)

  - GUILD_CREATE           // 当机器人加入新guild时
  - GUILD_UPDATE           // 当guild资料发生变更时
  - GUILD_DELETE           // 当机器人退出guild时
  - 
  - CHANNEL_CREATE         // 当channel被创建时
  - CHANNEL_UPDATE         // 当channel被更新时
  - CHANNEL_DELETE         // 当channel被删除时
 */
export const GUILDS = async (event: any) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'GUILD',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: false
  } as AMessage

  /**
   * 事件匹配
   */
  if (new RegExp(/^GUILD.*$/).test(event.event)) {
    e.event = 'GUILD'
  } else {
    e.event = 'CHANNEL'
  }
  /**
   * 类型匹配
   */
  if (new RegExp(/CREATE$/).test(event.eventType)) {
    e.eventType = 'CREATE'
  } else if (new RegExp(/UPDATE$/).test(event.eventType)) {
    e.eventType = 'UPDATE'
  } else {
    e.eventType = 'DELETE'
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
