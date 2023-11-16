import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import {
  EventEnum,
  EventType,
  InstructionMatching,
  PlatformEnum
} from '../../../core/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import {
  ClientControllerOnMessage,
  ClientControllerOnMember
} from '../controller.js'

/**
 * @param event 回调数据
 */
export async function MESSAGE_BUTTON(event: {
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
      ClickMsgComponent: {
        villa_id: number
        room_id: number
        component_id: string
        msg_uid: string
        uid: number
        bot_msg_id: string
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  const ClickMsgComponent = event.extend_data.EventData.ClickMsgComponent

  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID

  /**
   * 制作控制器
   */
  const Message = ClientControllerOnMessage({
    guild_id: ClickMsgComponent.villa_id,
    channel_id: ClickMsgComponent.room_id,
    msg_id: ClickMsgComponent.msg_uid,
    send_at: 0
  })

  const Member = ClientControllerOnMember({
    guild_id: ClickMsgComponent.villa_id,
    user_id: String(ClickMsgComponent.uid)
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: String(ClickMsgComponent.uid) == masterID,
    guild_id: String(ClickMsgComponent.villa_id),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(ClickMsgComponent.room_id),
    attachments: [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg_id: `${ClickMsgComponent.msg_uid}.`,
    msg: '',
    msg_txt: '',

    //
    user_id: String(ClickMsgComponent.uid),
    user_name: '',
    user_avatar: '',
    //
    send_at: 0,
    segment: segmentVILLA,
    /**
     *消息发送
     * @param msg
     * @param img
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
      const villa_id = select?.guild_id ?? ClickMsgComponent.villa_id
      const room_id = select?.channel_id ?? ClickMsgComponent.room_id
      return await replyController(villa_id, room_id, msg, {
        quote: select?.quote
      })
    },
    Message,
    Member
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, ''))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, ''))
}
