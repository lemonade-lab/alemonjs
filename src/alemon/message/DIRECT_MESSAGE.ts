import { IOpenAPI, IGuild } from 'qq-guild-bot'
import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { PathLike } from 'fs'
import {
  BotType,
  BotConfigType,
  sendImage,
  EventType,
  EType,
  postImage,
  InstructionMatching,
  typeMessage
} from 'alemon'

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
  //频道管理
  var guilds: Array<IGuild>
  //机器人配置
  var cfg: BotConfigType
}
/**
DIRECT_MESSAGE (1 << 12)
  - DIRECT_MESSAGE_CREATE   // 当收到用户发给机器人的私信消息时
  - DIRECT_MESSAGE_DELETE   // 删除（撤回）消息事件
 */
export const DIRECT_MESSAGE = () => {
  ws.on(AvailableIntentsEventsEnum.DIRECT_MESSAGE, async (e: AlemonMsgType) => {
    if (new RegExp(e.eventType).test('/^DIRECT_MESSAGE_DELETE$/')) {
      e.eventType = EventType.DELETE
      e.isRecall = true
      //只匹配类型函数
      typeMessage(e)
    }

    /* 事件匹配 */
    e.event = EType.MESSAGES

    e.eventType = EventType.CREATE

    /* 屏蔽测回消息 */
    e.isRecall = false

    /* 是私聊 */
    e.isGroup = true

    const BotPS = await channewlPermissions(e.msg.channel_id, robot.user.id)
    const UserPS = await channewlPermissions(e.msg.channel_id, e.msg.author.id)

    e.bot_permissions = BotPS
    e.user_permissions = UserPS

    e.identity = {
      master: false, //频道主人
      member: false, //成员
      grade: '1', //等级
      admins: false, //管理员
      wardens: false //子频道管理也
    }

    /* 消息发送机制 */
    e.reply = async (msg?: string | object | Array<string>, obj?: object) => {
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      const options = typeof msg === 'object' && !obj ? msg : obj
      return await client.directMessageApi
        .postDirectMessage(e.msg.guild_id, {
          msg_id: e.msg.id,
          content,
          ...options
        })
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    }

    /**
     * 表情表态
     * @param boj 表情对象
     */
    e.deleteEmoji = async (boj: any): Promise<boolean> => {
      console.info('私信无此功能')
      return false
    }

    e.postEmoji = async (boj: any): Promise<boolean> => {
      console.info('私信无此功能')
      return false
    }

    /**
     * 发送本地图片
     * @param content 消息内容  可选
     * @param file_image 消息图片
     * @returns
     */
    e.sendImage = async (file_image: PathLike, content?: string): Promise<boolean> => {
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
    e.postImage = async (file_image: PathLike, content?: string): Promise<boolean> => {
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

    /* 消息 */
    e.cmd_msg = e.msg.content

    /* 消息处理 */
    InstructionMatching(e).catch((err: any) => console.error(err))

    console.info(
      `\n[${e.msg.author.username}][${e.msg.author.id}][${e.isGroup}] ${
        e.msg.content ? e.msg.content : ''
      }`
    )
  })
}
