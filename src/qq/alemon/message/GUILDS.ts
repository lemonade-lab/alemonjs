import { typeMessage } from 'alemon'
import { EventType, EventEnum, AMessage, PlatformEnum } from 'alemon'
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
export const GUILDS = async (data: any) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    event: EventEnum.GUILD,
    eventType: EventType.CREATE,
    /**
     * 不是私域
     */
    isPrivate: false,
    /**
     * 不是撤回
     */
    isRecall: false
  } as AMessage

  if (new RegExp(/^GUILD.*$/).test(data.event)) {
    e.event = EventEnum.GUILD
  } else {
    e.event = EventEnum.CHANNEL
  }
  if (new RegExp(/CREATE$/).test(data.eventType)) {
    e.eventType = EventType.CREATE
  } else if (new RegExp(/UPDATE$/).test(data.eventType)) {
    e.eventType = EventType.UPDATE
  } else {
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
