import { IOpenAPI } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { BotType, EventType, typeMessage, EType } from 'alemon'

/* 非依赖引用 */
import { channewlPermissions } from '../permissions'
import { AlemonMsgType } from '../types'

declare global {
  //接口对象
  var client: IOpenAPI
  //连接对象
  var ws: EventEmitter
  //机器人信息
  var robot: BotType
}

/**
GUILD_MEMBERS (1 << 1)
  - GUILD_MEMBER_ADD       // 当成员加入时
  - GUILD_MEMBER_UPDATE    // 当成员资料变更时
  - GUILD_MEMBER_REMOVE    // 当成员被移除时
 */
export const GUILD_MEMBERS = () => {
  /*监听新人事件*/
  ws.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, async (e: AlemonMsgType) => {
    /* 分配 */
    e.event = EType.GUILD_MEMBERS
    if (new RegExp(/ADD$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else if (new RegExp(/UPDATE$/).test(e.eventType)) {
      e.eventType = EventType.UPDATE
    } else {
      e.eventType = EventType.DELETE
    }

    const { data } = await client.channelApi.channels(e.msg.guild_id)

    const channel = data.find(item => item.type === 0)

    if (channel) {
      const BotPS = await channewlPermissions(channel.id, robot.user.id)
      e.bot_permissions = BotPS
    }

    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    e.reply = async (msg?: string | object | Array<string>, obj?: object): Promise<boolean> => {
      if (channel) {
        const content = Array.isArray(msg)
          ? msg.join('')
          : typeof msg === 'string'
          ? msg
          : undefined
        const options = typeof msg === 'object' && !obj ? msg : obj
        return await client.messageApi
          .postMessage(channel.id, {
            content,
            ...options
          })
          .then(() => true)
          .catch((err: any) => {
            console.error(err)
            return false
          })
      }
      return false
    }

    //只匹配类型
    typeMessage(e)
  })
}
