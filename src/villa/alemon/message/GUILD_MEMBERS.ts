import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import { ClientControllerOnMessage } from '../controller.js'

/**
 * 成员进入
 * @param event 回调数据
 * @param val  类型控制
 */
export async function GUILD_MEMBERS(event: {
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

  const Message = ClientControllerOnMessage({
    guild_id: JoinVilla.villa_id,
    channel_id: 0,
    msg_id: '0',
    send_at: 0
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    event: 'GUILD_MEMBERS' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: masterID == String(JoinVilla.join_uid),
    guild_id: String(JoinVilla.villa_id),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    //
    attachments: [],
    specials: [],
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: event.id,
    msg_txt: '',

    //
    user_avatar: '', // dodo 可以通过 请求权限获得
    user_id: String(event.extend_data.EventData.JoinVilla.join_uid),
    user_name: event.extend_data.EventData.JoinVilla.join_user_nickname,
    send_at: JoinVilla.join_at,
    segment: segmentVILLA,
    /**
     * 消息回复
     * @param msg
     * @param select
     * @returns
     */
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
      const villa_id = select?.guild_id ?? JoinVilla.villa_id
      const room_id = select?.channel_id ?? false
      if (!room_id) return false
      return await replyController(villa_id, room_id, msg)
    },
    Message
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
