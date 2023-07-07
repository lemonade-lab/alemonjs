import { Messagetype, EventType, EType, InstructionMatching } from 'alemon'
import { sendMessage } from '../alemonapi.js'
import { BotEvent, MessageContentType, MHYType } from '../types.js'
import { createCOS } from '../cos.js'
/**
 * 消息会话
 * @param event 回调数据
 * @param val  类型控制
 */
export async function MESSAGES(event: BotEvent, val: number) {
  console.log('消息会话', event) // 消息类型
  console.log('消息会话', event.robot.template) // 机器人信息
  console.log('数据', event.extend_data.EventData) // 数据监听
  /**  数据包 */
  const MessageContent: MessageContentType = JSON.parse(
    event.extend_data.EventData.SendMessage.content
  )
  console.log('消息内容字符转换', MessageContent) // 数据监听
  // 房间号
  const room_id = event.extend_data.EventData.SendMessage.room_id
  /** 指令消息需要去除 @ 和用户名 */
  const cmd_msg = MessageContent.content.text.replace(/(@[^\s]+\s*|\s+$)/g, '')
  // 上传图片
  const COS = createCOS()
  /** 制作e消息对象 */
  const e = {
    /** 消息编号 */
    eventId: event.id,
    /** 事件类型 */
    event: EType.MESSAGES,
    /** 消息类型  */
    eventType: EventType.CREATE,
    /**  消息对象 */
    msg: {
      channel_id: String(room_id), // 房间
      author: {
        id: MessageContent.user.id, // 用户编号
        username: MessageContent.user.name, // 用户名
        bot: false, // 是否是bot
        avatar: MessageContent.user.portrait // 头像
      },
      content: MessageContent.content.text // 指令消息
    },
    /** 是否是私域 */
    isPrivate: false,
    /** 是否是群聊 */
    isGroup: true,
    /**  是否是撤回 */
    isRecall: false,
    /** 艾特得到的qq */ // 忽略机器人
    atuid: [],
    /** 是否是艾特 */
    at: false,
    /** 是否是机器人主人 */
    isMaster: false,
    /** 去除了艾特后的消息 */
    cmd_msg: cmd_msg,
    /* 消息发送 */
    reply: async (msg?: string | object | Array<string> | Buffer, obj?: object | Buffer) => {
      //  第一参数是buffer
      if (Buffer.isBuffer(msg)) {
        try {
          // 上传图片
          const randomNum = Math.floor(Math.random() * 31)
          COS.Upload(msg, `${randomNum}.jpg`)
          const url = COS.getUrl(`${randomNum}.jpg`)
          return await sendMessage(event.robot.villa_id, {
            room_id, //房间号
            object_name: MHYType.Text, // 消息类型
            msg_content: JSON.stringify({
              content: {
                text: cmd_msg,
                images: [
                  {
                    url, // 图片路径
                    with: '1080',
                    height: '2200'
                  }
                ]
              }
            }) // 要回复的消息
          }).catch(err => {
            console.log(err)
            return false
          })
        } catch (err) {
          console.error(err)
          return false
        }
      }
      // 第二参考书是 buffer
      if (Buffer.isBuffer(obj)) {
        try {
          // 上传图片
          const randomNum = Math.floor(Math.random() * 31)
          COS.Upload(obj, `${randomNum}.jpg`)
          const url = COS.getUrl(`${randomNum}.jpg`)
          return await sendMessage(event.robot.villa_id, {
            room_id, //房间号
            object_name: MHYType.Text, // 消息类型
            msg_content: JSON.stringify({
              content: {
                text: msg,
                images: [
                  {
                    url, // 图片路径
                    with: '1080',
                    height: '2200'
                  }
                ]
              }
            }) // 要回复的消息
          }).catch(err => {
            console.log(err)
            return false
          })
        } catch (err) {
          console.error(err)
          return false
        }
      }
      // 判断 msg 是否是  arr  是就转换
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      // 判断msg是否是  obj
      const options = typeof msg === 'object' && !obj ? msg : obj
      await sendMessage(event.robot.villa_id, {
        room_id, //房间号
        object_name: MHYType.Text, // 消息类型
        msg_content: JSON.stringify({
          content: {
            // 消息文本   支持  [爱心] 来转换成表情
            text: content,
            ...options
            // entities: []  // 消息文本内嵌的实体信息 用来描述text的特殊渲染
            // mentionedInfo: {}  // 定义@
            // quote: {}  // 引用消息
          }
        }) // 要回复的消息
      }).catch(err => {
        console.log(err)
        return false
      })
      return true
    }
  }

  // 业务处理
  await InstructionMatching(e as Messagetype) // 转义
    .then(() => {
      console.info(`\n[${e.msg.channel_id}] [${e.msg.author.username}]\n${e.msg.content}${true}`)
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(`\n[${e.msg.channel_id}] [${e.msg.author.username}]\n${e.msg.content}${false}`)
      return false
    })
  return false
}
