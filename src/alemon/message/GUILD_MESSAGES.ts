import { IOpenAPI, IGuild } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { BotType, EventType, EType, BotConfigType, typeMessage } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types'
import { guildMessges } from './GUILD_MESSAGE'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人信息
  var robot: BotType
  //频道管理
  var guilds: Array<IGuild>
  //机器人配置
  var cfg: BotConfigType
}

/** 
GUILD_MESSAGES (1 << 9)    // 消息事件，仅 *私域* 机器人能够设置此 intents。
  - MESSAGE_CREATE         
  // 频道内的全部消息，
  而不只是 at 机器人的消息。
  内容与 AT_MESSAGE_CREATE 相同
  - MESSAGE_DELETE         // 删除（撤回）消息事件
 * */
export const GUILD_MESSAGES = () => {
  ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, async (e: AlemonMsgType) => {
    /* 是私域 */
    e.isPrivate = true
    /* 撤回消息 */
    if (new RegExp(/DELETE$/).test(e.eventType)) {
      e.event = EType.MESSAGES
      e.eventType = EventType.DELETE
      e.isRecall = true
      typeMessage(e).catch((err: any) => console.error(err))
      return
    }
    /* 测回消息 */
    e.isRecall = false
    /* 消息方法 */
    guildMessges(e).catch((err: any) => console.error(err))
  })
}