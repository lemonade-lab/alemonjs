import { typeMessage, PlatformEnum } from 'alemon'
import { EventEnum, EventType, AMessage } from 'alemon'
import { getBotMsgByQQ } from '../bot.js'
/**
 * AUDIO_MICROPHONE 音频
 * AUDIO_FREQUENCY 麦克风
 */

/**
 * DO
 */

/**
AUDIO_ACTION (1 << 29)
  - AUDIO_START             // 音频开始播放时  create
  - AUDIO_FINISH            // 音频播放结束时 delete
  - AUDIO_ON_MIC            // 上麦时  create
  - AUDIO_OFF_MIC           // 下麦时 delete
 */
export const AUDIO_ACTION = async (data: any) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    /**
     * 麦克风事件
     */
    event: EventEnum.AUDIO_MICROPHONE,
    /**
     * 上麦
     */
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

  if (new RegExp(/MIC$/).test(data.eventType)) {
    if (!new RegExp(/ON_MIC$/).test(data.eventType)) {
      /**
       * 下麦
       */
      e.eventType = EventType.DELETE
    }
  } else {
    /**
     * 音频事件
     */
    e.event = EventEnum.AUDIO_FREQUENCY
    if (!new RegExp(/^AUDIO_START$/).test(data.eventType)) {
      /**
       * 音频播放结束时
       */
      e.eventType = EventType.DELETE
    }
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
      console.info(`\n[${e.event}] [${e.eventType}]\n${false}`)
      return false
    })
}
