import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import {
  type EventEnum,
  type TypingEnum,
  APPS,
  type MessageBingdingOption,
  type UserType
} from '../../../core/index.js'
import { MessageContentType } from '../../sdk/index.js'
import { BOTCONFIG } from '../../../config/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import { Controllers } from '../controller.js'

/**
 * 消息会话
 * @param event 回调数据
 */
export async function MESSAGES(event: {
  robot: {
    template: {
      id: string
      name: string
      desc: string
      icon: string
      customSettings: any[]
      commands: Array<{
        name: string // 指令
        desc: string // 指令说明
      }>
    }
    villaId: number
  }
  type: number
  extendData: {
    sendMessage: {
      content: string // 字符串消息合集  MessageContentType
      fromUserId?: number // 来自用户id
      sendAt: number // 发送事件编号
      objectName: number // 对象名称
      roomId: number // 房间号
      nickname: string // 昵称
      msgUid: string // 消息ID
      villaId: string // 别野编号
      quoteMsg?: {
        content: string
        msgUid: string
        sendAt: number
        msgType: string
        botMsgId: string
        fromUserIdStr: string
        msgPoc: string
      }
    }
  }
  createdAt: number
  id: string
  sendAt: number
}) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const SendMessage = event.extendData.sendMessage

  /**
   * 数据包解析
   */
  const MessageContent: MessageContentType = JSON.parse(
    event.extendData.sendMessage.content
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
        avatar: '',
        bot: false
      })
      continue
    }
    if (item.entity.bot_id) {
      at_users.push({
        id: item.entity.bot_id,
        name,
        avatar: '',
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
   * 清除 @ 后的消息
   */
  const msg = txt.replace(/(@[^\s]+\s)(?!<)/g, '').trim()

  const cfg = BOTCONFIG.get('villa')
  const masterID = cfg.masterID

  const msg_id = `${SendMessage.msgUid}.${SendMessage.sendAt}`

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa',
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: MessageContent.user.id == masterID,
    guild_id: String(SendMessage.villaId),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(SendMessage.roomId),
    attachments: [event.extendData.sendMessage.quoteMsg],
    specials: [],
    //
    at,
    at_users: at_users,
    at_user,
    msg_id: msg_id,
    msg: msg,
    msg_txt: txt,
    quote: MessageContent.quote
      ? `${MessageContent.quote.original_message_id}.${MessageContent.quote.original_message_send_time}`
      : '',
    open_id: '',

    //
    user_id: MessageContent.user.id,
    user_name: MessageContent.user.name,
    user_avatar: MessageContent.user.portrait,
    //
    send_at: SendMessage.sendAt,
    segment: segmentVILLA,
    /**
     *消息发送
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      if (select?.open_id && select?.open_id != '') {
        console.error('VILLA 无私信')
        return false
      }
      const villaId = select?.guild_id ?? SendMessage.villaId
      const roomId = select?.channel_id ?? SendMessage.roomId
      return await replyController(villaId, roomId, msg, {
        quote: select?.quote
      })
    },
    Controllers
  }
  APPS.responseMessage(e)
  return
}
