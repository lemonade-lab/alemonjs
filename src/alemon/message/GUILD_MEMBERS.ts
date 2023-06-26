import { IOpenAPI } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { sendImage, postImage, typeMessage } from 'alemon'
import { BotType, EventType, EType, Messagetype } from 'alemon'

/* 非依赖引用 */
import { channewlPermissions } from '../permissions.js'

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
  ws.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, async (e: Messagetype) => {
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
     * 发送本地图片
     * @param content 消息内容  可选
     * @param file_image 消息图片
     * @returns
     */
    e.sendImage = async (file_image: string | Buffer | URL, content?: string): Promise<boolean> => {
      return await sendImage(
        e.msg.guild_id,
        {
          msg_id: e.msg.id, //消息id, 必须
          file_image, //buffer
          content
        },
        e.isGroup
      )
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }

    /**
     * 发送截图
     * @param file_image
     * @param content 内容,可选
     * @returns
     */
    e.postImage = async (file_image: string | Buffer | URL, content?: string): Promise<boolean> => {
      return await postImage(
        e.msg.guild_id,
        {
          msg_id: e.msg.id, //消息id, 必须
          file_image, //buffer
          content
        },
        e.isGroup
      )
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }

    /**
     * 新人进出频道时
     * @param msg
     * @param obj
     * @returns
     */

    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    e.reply = async (
      msg?: string | object | Array<string> | Buffer,
      obj?: object | Buffer
    ): Promise<boolean> => {
      if (channel) {
        if (Buffer.isBuffer(msg)) {
          if (e.isGroup) return false
          try {
            return await e.postImage(msg)
          } catch (err) {
            console.error(err)
            return false
          }
        }
        const content = Array.isArray(msg)
          ? msg.join('')
          : typeof msg === 'string'
          ? msg
          : undefined
        if (Buffer.isBuffer(obj)) {
          if (e.isGroup) return false
          try {
            return await e.postImage(obj, content)
          } catch (err) {
            console.error(err)
            return false
          }
        }
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
