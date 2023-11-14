import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSEventError, AlemonJSEventLog } from '../../..//log/event.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'

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
    EventData: {
      AuditCallback: {
        audit_id: string // 审核事件 id
        bot_tpl_id: string // 机器人 id
        villa_id: number // 大别野 id
        room_id: number // 房间 id（和审核接口调用方传入的值一致）
        user_id: number // 用户 id（和审核接口调用方传入的值一致）
        pass_through: string // 透传数据（和审核接口调用方传入的值一致）
        audit_result: number // 审核结果，0作兼容，1审核通过，2审核驳回
      }
    }
  }
  created_at: number // 创建事件编号
  id: string // 消息编号
  send_at: number // 发送事件编号
}) {
  const AuditCallback = event.extend_data.EventData.AuditCallback
  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID
  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'MESSAGE_AUDIT' as (typeof EventEnum)[number],
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
    isMaster: masterID == String(AuditCallback.user_id),
    msg: '',
    msg_id: AuditCallback.audit_id,
    attachments: [],
    specials: [],
    at_user: undefined,
    guild_id: String(AuditCallback.villa_id),
    channel_id: String(AuditCallback.room_id),
    msg_txt: '',
    user_id: String(AuditCallback.user_id),
    user_name: '',
    msg_create_time: event.send_at,
    segment: segmentVILLA,
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
