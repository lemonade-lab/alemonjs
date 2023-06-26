import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { typeMessage } from 'alemon'
import { EType, EventType, Messagetype } from 'alemon'

declare global {
  var ws: EventEmitter
}

/**
 * AUDIO_MICROPHONE 音频
 * AUDIO_FREQUENCY 麦克风
 */

/**
AUDIO_ACTION (1 << 29)
  - AUDIO_START             // 音频开始播放时  create
  - AUDIO_FINISH            // 音频播放结束时 delete
  - AUDIO_ON_MIC            // 上麦时  create
  - AUDIO_OFF_MIC           // 下麦时 delete
 */
export const AUDIO_ACTION = () => {
  ws.on(AvailableIntentsEventsEnum.AUDIO_ACTION, (e: Messagetype) => {
    /* 事件匹配 */
    if (new RegExp(/MIC$/).test(e.eventType)) {
      // 麦克风事件
      e.event = EType.AUDIO_MICROPHONE
      if (new RegExp(/ON_MIC$/).test(e.eventType)) {
        // 上麦
        e.eventType = EventType.CREATE
      } else {
        // 下麦
        e.eventType = EventType.DELETE
      }
    } else {
      // 音频事件
      e.event = EType.AUDIO_FREQUENCY
      if (new RegExp(/^AUDIO_START$/).test(e.eventType)) {
        // 音频播放结束时音频开始播放时
        e.eventType = EventType.CREATE
      } else {
        // 音频播放结束时
        e.eventType = EventType.DELETE
      }
    }
    //只匹配类型
    typeMessage(e)
  })
}
