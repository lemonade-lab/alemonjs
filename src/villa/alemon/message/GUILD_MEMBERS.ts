import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'

/**
 * todo
 * 未判断成员退出别野
 */

/**
 * 成员进出
 * @param event 回调数据
 * @param val  类型控制
 */
export async function GUILD_MEMBERS_VILLA(event: {
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
      JoinVilla: {
        join_uid: number // 用户编号
        join_user_nickname: string // 用户名称
        join_at: number // 进入事件编号
        villa_id: number // 别野编号
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  /**
   * 别野编号
   */
  const villa_id = event.robot.villa_id ?? ''
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
    event: 'GUILD_MEMBERS' as (typeof EventEnum)[number],
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
     *
     */
    at_user: undefined,
    /**
     *
     */
    guild_id: String(villa_id),
    /**
     * 房间编号:空
     */
    channel_id: '',
    /**
     * 原文消息
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
     * 消息触发时间
     */
    msg_create_time: new Date().getTime(),
    /**
     * 模板方法
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
