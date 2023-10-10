import { AMessage, typeMessage } from '../../../alemon/index.js'
import { BotEvent } from 'mys-villa'
import { segmentVilla } from '../segment.js'
import { now_e } from './e.js'

/**
 * 如何判断审核事件成功与否？
 */

/**
 * 审核事件
 * @param event 回调数据
 * @param val  类型控制
 */
export async function MESSAGE_AUDIT_VILLA(event: BotEvent) {
  /**
   * 别野编号
   */
  const villa_id = event.robot.villa_id ?? ''
  /**
   * 房间号
   */
  const room_id = event.extend_data.EventData.SendMessage?.room_id ?? ''
  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa',
    /**
     * 机器人信息
     */
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    /**
     * 事件类型
     */
    event: 'MESSAGE_AUDIT',
    /**
     * 消息类型
     */
    eventType: 'CREATE',
    /**
     * 是否是私域
     */
    isPrivate: false,
    /**
     * 是否是群聊
     */
    isGroup: true,
    /**
     * 是否是撤回
     */
    isRecall: false,
    /**
     * 艾特得到的qq
     */
    at_users: [],
    /**
     * 是否是艾特
     */
    at: false,
    /**
     * 是否是机器人主人
     */
    isMaster: false,
    /**
     * 去除了艾特后的消息
     */
    msg: '',
    /**
     * 别野编号
     */
    msg_id: event.id,
    /**
     * 艾特用户
     */
    at_user: undefined,
    /**
     *
     */
    guild_id: String(villa_id),
    /**
     * 房间编号
     */
    channel_id: String(room_id),
    /**
     *
     */
    msg_txt: '',
    /**
     * 用户编号
     */
    user_id: '',
    /**
     * 用户名
     */
    user_name: '',
    /**
     * 消息创建时间
     */
    msg_create_time: new Date().getTime(),
    /**
     * 模板函数
     */
    segment: segmentVilla,
    /**
     * 用户头像
     */
    user_avatar: '',
    ...now_e,
    reply: async (
      msg?: string | string[] | Buffer,
      img?: Buffer | string,
      name?: string
    ) => {
      return false
    }
  } as AMessage
  /**
   * 只匹配类型
   */
  await typeMessage(e)
    .then(() => {
      console.info(`\n[${e.event}] [${e.eventType}] [${true}] `)
      return true
    })
    .catch(err => {
      console.error(`\n[${e.event}] [${e.eventType}] [${false}] `)
      console.error(err)
      return false
    })
}
