import { IOpenAPI, IGuild } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { BotType, BotConfigType, EType, typeMessage, EventType } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types'

import { guildMessges } from './guildMessges'

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
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
export const PUBLIC_GUILD_MESSAGES = (cfg: BotConfigType) => {
  ws.on(AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES, async (e: AlemonMsgType) => {
    if (cfg.sandbox) console.info(e)

    /* 事件匹配 */
    e.event = EType.MESSAGES

    /*   是私域 */
    e.isPrivate = true

    /* 屏蔽测回消息 */
    e.isRecall = false

    if (new RegExp(e.eventType).test('/^PUBLIC_MESSAGE_DELETE$/')) {
      e.eventType = EventType.DELETE
      e.isRecall = true
      //只匹配类型函数
      typeMessage(e)
    }

    if (new RegExp(e.eventType).test('/^AT_MESSAGE_CREATE$/')) {
      /* 类型匹配 */
      e.eventType = EventType.CREATE
      /* 消息方法 */
      guildMessges(cfg, e).catch((err: any) => console.error(err))
    }
  })
}
