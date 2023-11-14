import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
import { getBotConfigByKey } from '../../../config/index.js'

/**
 * 成员进入
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
  const JoinVilla = event.extend_data.EventData.JoinVilla

  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'GUILD_MEMBERS' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isPrivate: false,
    isGroup: true,
    isRecall: false,
    at_users: [],
    at: false,
    isMaster: masterID == String(JoinVilla.join_uid),
    msg: '',
    msg_id: event.id,
    attachments: [],
    specials: [],
    guild_id: String(JoinVilla.villa_id),
    channel_id: '',
    msg_txt: '',
    user_avatar: '',
    user_id: String(event.extend_data.EventData.JoinVilla.join_uid),
    user_name: event.extend_data.EventData.JoinVilla.join_user_nickname,
    msg_create_time: JoinVilla.join_at,
    segment: segmentVILLA,
    at_user: undefined,
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
