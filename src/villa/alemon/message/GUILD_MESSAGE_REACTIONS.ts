import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
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
 * 表情表态
 * @param event 回调数据
 */
export async function GUILD_MESSAGE_REACTIONS(event: {
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
      // 增加和删除都是一个数据位
      AddQuickEmoticon: {
        villa_id: number // 别野编号
        room_id: number // 房间编号
        uid: number // 用户编号
        emoticon_id: number // 表情编号
        emoticon: string // 表情说明  emoticon:狗头  =>  [狗头]
        is_cancel?: boolean // 是撤回为  ture
        msg_uid: string // 消息是谁的
        bot_msg_id: string // 机器人消息编号
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  const AddQuickEmoticon = event.extend_data.EventData.AddQuickEmoticon

  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID

  const Message = ClientControllerOnMessage({
    guild_id: AddQuickEmoticon.villa_id,
    channel_id: AddQuickEmoticon.room_id,
    msg_id: '0',
    send_at: 0
  })

  const Member = ClientControllerOnMember({
    guild_id: AddQuickEmoticon.villa_id,
    user_id: String(AddQuickEmoticon.uid)
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    eventType: event.extend_data.EventData.AddQuickEmoticon.is_cancel
      ? 'DELETE'
      : ('CREATE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: masterID == String(AddQuickEmoticon.uid),
    guild_id: String(AddQuickEmoticon.villa_id),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: String(AddQuickEmoticon.room_id),
    attachments: [],
    specials: [
      {
        emoticon_id: AddQuickEmoticon.emoticon_id,
        emoticon_type: 0,
        emoticon: AddQuickEmoticon.emoticon,
        is_cancel: AddQuickEmoticon?.is_cancel ?? false,
        msg_uid: AddQuickEmoticon.msg_uid
      }
    ],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: `${AddQuickEmoticon.msg_uid}.${event.send_at}`,
    msg_txt: '',

    //
    user_id: String(AddQuickEmoticon.uid),
    user_name: '', // dodo 可权限获得
    user_avatar: '', // dodo 可权限获得
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
      const villa_id = select?.guild_id ?? AddQuickEmoticon.villa_id
      const room_id = select?.channel_id ?? AddQuickEmoticon.room_id
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
