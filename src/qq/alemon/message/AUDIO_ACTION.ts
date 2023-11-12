import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  AMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
/**
 * AUDIO_MICROPHONE 音频
 * AUDIO_FREQUENCY 麦克风
 */

/**
 * TUDO
 */

/**
AUDIO_ACTION (1 << 29)
  - AUDIO_START             // 音频开始播放时  create
  - AUDIO_FINISH            // 音频播放结束时 delete
  - AUDIO_ON_MIC            // 上麦时  create
  - AUDIO_OFF_MIC           // 下麦时 delete
 */
export const AUDIO_ACTION = async (event: any) => {
  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'AUDIO_MICROPHONE' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    /**
     * 附件消息
     */
    attachments: [],
    /**
     * 特殊消息
     */
    specials: []
  } as AMessage

  if (new RegExp(/MIC$/).test(event.eventType)) {
    if (!new RegExp(/ON_MIC$/).test(event.eventType)) {
      /**
       * 下麦
       */
      e.eventType = 'DELETE'
    }
  } else {
    /**
     * 音频事件
     */
    e.event = 'AUDIO_FREQUENCY'
    if (!new RegExp(/^AUDIO_START$/).test(event.eventType)) {
      /**
       * 音频播放结束时
       */
      e.eventType = 'DELETE'
    }
  }

  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
