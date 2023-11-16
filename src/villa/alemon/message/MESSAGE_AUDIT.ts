import { AlemonJSEventError, AlemonJSEventLog } from '../../..//log/index.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { replyController } from '../reply.js'
import {
  ClientControllerOnMember,
  ClientControllerOnMessage
} from '../controller.js'

/**
 * 审核事件
 * @param event 回调数据
 */
export async function MESSAGE_AUDIT(event: {
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

  const Message = ClientControllerOnMessage({
    guild_id: AuditCallback.villa_id,
    channel_id: AuditCallback.room_id,
    msg_id: '0',
    send_at: 0
  })

  const Member = ClientControllerOnMember({
    guild_id: AuditCallback.villa_id,
    user_id: String(AuditCallback.user_id)
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    event: 'MESSAGE_AUDIT' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: masterID == String(AuditCallback.user_id),
    guild_id: String(AuditCallback.villa_id),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(AuditCallback.room_id),
    attachments: [],
    specials: [],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: `${AuditCallback.audit_id}.${event.send_at}`,
    msg_txt: '',

    //
    user_id: String(AuditCallback.user_id),
    user_name: '', // dodo 可权限获得
    user_avatar: '', // dodo 可权限获得
    //
    send_at: event.send_at,
    segment: segmentVILLA,
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
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {
      const villa_id = select?.guild_id ?? AuditCallback.villa_id
      const room_id = select?.channel_id ?? AuditCallback.room_id
      return await replyController(villa_id, room_id, msg, {
        quote: select?.quote
      })
    },
    Message,
    Member
  }
  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
