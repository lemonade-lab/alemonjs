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
 * 表情表态
 * @param event 回调数据
 * @param val  类型控制
 */
export async function GUILD_MESSAGE_REACTIONS_VILLA(event: {
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

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    eventType: event.extend_data.EventData.AddQuickEmoticon.is_cancel
      ? 'DELETE'
      : ('CREATE' as (typeof EventType)[number]),
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
    isMaster: masterID == String(AddQuickEmoticon.uid),
    msg: '',
    msg_id: event.id,
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
    guild_id: String(AddQuickEmoticon.villa_id),
    channel_id: String(AddQuickEmoticon.room_id),
    msg_txt: '',
    user_id: String(AddQuickEmoticon.uid),
    user_name: '',
    msg_create_time: event.send_at,
    segment: segmentVILLA,
    at_user: undefined,
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
