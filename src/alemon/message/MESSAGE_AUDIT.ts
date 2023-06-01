import { IOpenAPI, IGuild } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { BotType, BotConfigType, EType, typeMessage } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人信息
  var robot: BotType
  //频道管理
  var guilds: Array<IGuild>
}

/**
MESSAGE_AUDIT (1 << 27)
- MESSAGE_AUDIT_PASS     // 消息审核通过
- MESSAGE_AUDIT_REJECT   // 消息审核不通过
 */
export const MESSAGE_AUDIT = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.MESSAGE_AUDIT, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.MESSAGE_AUDIT
    //只匹配类型
    typeMessage(e)
  })
}
