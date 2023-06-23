import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { EType, typeMessage, EventType } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types.js'

declare global {
  var ws: EventEmitter
}

/**
 * *************
 * todo
 * 该事件需要拆分
 * *********
 * frequency  音频
 * microphone  麦克风
 */

/**
AUDIO_ACTION (1 << 29)
  - AUDIO_START             // 音频开始播放时
  - AUDIO_FINISH            // 音频播放结束时
  - AUDIO_ON_MIC            // 上麦时
  - AUDIO_OFF_MIC           // 下麦时
 */
export const AUDIO_ACTION = () => {
  ws.on(AvailableIntentsEventsEnum.AUDIO_ACTION, (e: AlemonMsgType) => {
    /* 事件匹配 */
    e.event = EType.AUDIO_ACTION
    if (new RegExp(/ON_MIC$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else {
      e.eventType = EventType.DELETE
    }
    //只匹配类型
    typeMessage(e)
  })
}
