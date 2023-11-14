import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import {
  EventEnum,
  EventType,
  InstructionMatching,
  PlatformEnum,
  UserType
} from '../../../core/index.js'
import { MessageContentType } from '../../sdk/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import { ClientController } from '../controller.js'

/**
 * 消息会话
 * @param event 回调数据
 * @param val  类型控制
 */
export async function MESSAGES(event: {
  robot: {
    template: {
      id: string
      name: string
      desc: string
      icon: string
      commands: Array<{
        name: string // 指令
        desc: string // 指令说明
      }>
    }
    villa_id: number
  }
  type: number
  extend_data: {
    EventData: {
      SendMessage: {
        content: string // 字符串消息合集  MessageContentType
        from_user_id: number // 来自用户id
        send_at: number // 发送事件编号
        object_name: number // 对象名称
        room_id: number // 房间号
        nickname: string // 昵称
        msg_uid: string // 消息ID
        villa_id: string // 别野编号
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  const SendMessage = event.extend_data.EventData.SendMessage

  /**
   * 数据包解析
   */
  const MessageContent: MessageContentType = JSON.parse(
    event.extend_data.EventData.SendMessage.content
  )

  /**
   * 得到特效
   */
  const entities = MessageContent.content?.entities ?? []
  /**
   * 收集uid
   */
  const at_users: UserType[] = []
  /**
   * at控制
   */
  let at = false

  /**
   * 艾特用户
   */
  let at_user: UserType | undefined = undefined

  /**
   * 消息原文
   */
  const txt = MessageContent.content.text
  /**
   * 解析
   */
  for await (const item of entities) {
    const name = txt
      .substring(item.offset, item.offset + item.length)
      .trim()
      .replace(/^@|(\s+)?$/g, '')
    if (item.entity.user_id) {
      /**
       * 存在用户艾特
       */
      at = true
      at_users.push({
        id: item.entity.user_id,
        name,
        avatar: 'string',
        bot: false
      })
      continue
    }
    if (item.entity.bot_id) {
      at_users.push({
        id: item.entity.bot_id,
        name,
        avatar: 'string',
        bot: true
      })
      continue
    }
  }
  /**
   * 存在at
   */
  if (at) {
    /**
     * 找到第一个不是bot的用户
     */
    at_user = at_users.find(item => item.bot != true)
  }
  /**
   * 得到登录配置
   */

  const cfg = getBotConfigByKey('villa')

  /**
   * 得到主人id
   */
  const masterID = cfg.masterID

  /**
   * 清除 @ 后的消息
   */
  const msg = txt.replace(/(@[^\s]+\s)(?!<)/g, '').trim()

  /**
   * 制作控制器
   */
  const controller = ClientController({
    guild_id: SendMessage.villa_id,
    channel_id: SendMessage.room_id,
    msg_id: SendMessage.msg_uid,
    send_at: SendMessage.send_at
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isPrivate: false,
    isGroup: true,
    isRecall: false,
    isMaster: MessageContent.user.id == masterID,
    guild_id: String(SendMessage.villa_id),
    channel_id: String(SendMessage.room_id),
    attachments: [],
    specials: [],
    //
    at,
    at_users: at_users,
    at_user,
    msg_id: SendMessage.msg_uid,
    msg: msg,
    msg_txt: txt,
    //
    user_id: MessageContent.user.id,
    user_name: MessageContent.user.name,
    user_avatar: MessageContent.user.portrait,
    //
    send_at: SendMessage.send_at,
    segment: segmentVILLA,
    /**
     *消息发送
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {
      const villa_id = select?.guild_id ?? SendMessage.villa_id
      const room_id = select?.channel_id ?? SendMessage.room_id
      return await replyController(villa_id, room_id, msg)
    },
    controller
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() =>
      AlemonJSLog(e.channel_id, e.user_name, MessageContent.content.text)
    )
    .catch(err =>
      AlemonJSError(err, e.channel_id, e.user_name, MessageContent.content.text)
    )
}
