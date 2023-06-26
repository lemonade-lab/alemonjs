import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { typeMessage } from 'alemon'
import { EType, EventType, Messagetype } from 'alemon'

declare global {
  //连接对象
  var ws: EventEmitter
}

/**
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
export const GUILD_MESSAGE_REACTIONS = () => {
  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (e: Messagetype) => {
    /* 事件匹配 */
    e.event = EType.GUILD_MESSAGE_REACTIONS
    if (new RegExp(/ADD$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else {
      e.eventType = EventType.DELETE
    }
    //只匹配类型
    typeMessage(e)
  })
}

/**
 * 拥有表态消息权限时
 * 管理员机器人可以做分组管理员
 */
