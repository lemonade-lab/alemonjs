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
GUILD_MESSAGE_REACTIONS (1 << 10)
  - MESSAGE_REACTION_ADD    // 为消息添加表情表态
  - MESSAGE_REACTION_REMOVE // 为消息删除表情表态
 */
export const GUILD_MESSAGE_REACTIONS = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)
    /* 事件匹配 */
    e.event = EType.GUILD_MESSAGE_REACTIONS
    //只匹配类型
    typeMessage(e)
  })
}
