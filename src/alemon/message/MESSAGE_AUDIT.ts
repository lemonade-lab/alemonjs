import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { EType, typeMessage, EventType } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types.js'

declare global {
  //连接对象
  var ws: EventEmitter
}

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
export const MESSAGE_AUDIT = () => {
  ws.on(AvailableIntentsEventsEnum.MESSAGE_AUDIT, (e: AlemonMsgType) => {
    /* 事件匹配 */
    e.event = EType.MESSAGE_AUDIT
    if (new RegExp(/PASS$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else {
      e.eventType = EventType.DELETE
    }

    //只匹配类型
    typeMessage(e)
  })
}
