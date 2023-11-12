import { AlemonJSEventError, AlemonJSEventLog } from '../../..//log/event.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'

/**
 * tudo
 * 如何判断审核事件成功与否？
 */

/**
 * 审核事件
 * @param event 回调数据
 * @param val  类型控制
 */
export async function MESSAGE_AUDIT_VILLA(event: {
  // 机器人相关信息
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
    villa_id: number // 事件所属的大别野 id
  }
  type: number // 消息类型
  extend_data: {
    EventData: any
  }
  created_at: number // 创建事件编号
  id: string // 消息编号
  send_at: number // 发送事件编号
}) {
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
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
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
    event: 'MESSAGE_AUDIT' as (typeof EventEnum)[number],
    /**
     * 消息类型
     */
    eventType: 'CREATE' as (typeof EventType)[number],
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
     * 特殊消息
     */
    attachments: [],
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
    segment: segmentVILLA,
    /**
     * 用户头像
     */
    user_avatar: '',
    /**
     * 消息回复
     * @param msg
     * @param select
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
      }
    ): Promise<any> => {
      return false
    }
  }
  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
