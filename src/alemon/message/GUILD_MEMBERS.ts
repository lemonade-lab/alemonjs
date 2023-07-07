import { Messagetype, EventType, EType, InstructionMatching } from 'alemon'
import { BotEvent } from '../types.js'

/**
 * 机器人信息
 */

/**
 * 成员进出
 * @param event 回调数据
 * @param val  类型控制
 */
export async function GUILD_MEMBERS(event: BotEvent, val: number) {
  console.log('成员进出', event.robot.villa_id) // 别野编号
  console.log('成员进出', event.robot.template) // 机器人信息
  console.log('成员进出', event.type) // 消息类型
  console.log('成员进出', event.created_at)
  console.log('成员进出', event.id) //
  console.log('成员进出', event.send_at) //
  console.log('成员进出', event) //
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
      channel_id: '', // 房间
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
    cmd_msg: ''
    /* 消息发送 */
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
