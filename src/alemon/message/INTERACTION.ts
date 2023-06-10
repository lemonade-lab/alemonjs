import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { EType, typeMessage, EventType } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types'

declare global {
  //连接对象
  var ws: EventEmitter
}

/**
INTERACTION (1 << 26)
  - INTERACTION_CREATE     // 互动事件创建时
 */
export const INTERACTION = () => {
  ws.on(AvailableIntentsEventsEnum.INTERACTION, (e: AlemonMsgType) => {
    /* 事件匹配 */
    e.event = EType.INTERACTION
    if (new RegExp(/CREATE$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else {
      e.eventType = EventType.DELETE
    }
    //只匹配类型
    typeMessage(e)
  })
}
