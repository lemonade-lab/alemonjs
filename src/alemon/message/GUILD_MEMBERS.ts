import { Messagetype, EventType, EType, InstructionMatching } from 'alemon'
import { sendMessage } from '../alemonapi.js'
import { BotEvent, MHYType } from '../types.js'
import { createCOS } from '../cos.js'
export async function GUILD_MEMBERS(event: BotEvent) {
  console.log('成员进出', event.robot.villa_id)
  console.log('成员进出', event.robot.template)
  console.log('成员进出', event.type)
  console.log('成员进出', event.created_at)
  console.log('成员进出', event.id)
  console.log('成员进出', event.send_at)
  // 房间号
  const room_id = event.extend_data.EventData.SendMessage.room_id
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
        id: '', // 用户编号
        username: '', // 用户名
        bot: false, // 是否是bot
        avatar: '' // 头像
      },
      content: '' // 指令消息
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
    cmd_msg: '',
    /* 消息发送 */
    reply: async (msg?: string | object | Array<string> | Buffer, obj?: object | Buffer) => {
      //  第一参数是buffer
      if (Buffer.isBuffer(msg)) {
        try {
          COS.Upload(msg, 'mys.jpg')
          const url = COS.getUrl('mys.jpg')
          return await sendMessage(event.robot.villa_id, {
            room_id, //房间号
            object_name: MHYType.Text, // 消息类型
            msg_content: JSON.stringify({
              content: {
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
          COS.Upload(obj, 'mys.jpg')
          const url = COS.getUrl('mys.jpg')
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
      console.info(`\n[${e.msg.channel_id}] [${e.msg.author.username}]${true}`)
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(`\n[${e.msg.channel_id}] [${e.msg.author.username}]${false}`)
      return false
    })
}
