import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  EventEnum,
  EventType,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
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
        msg_uid: string // 用户消息编号
        bot_msg_id: string // 机器人消息编号
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
   * 房间号
   */
  const room_id = ''
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
    event: 'GUILD_MESSAGE_REACTIONS' as (typeof EventEnum)[number],
    /**
     * 消息类型 ： 存在则为撤回
     */
    eventType: event.extend_data.EventData.AddQuickEmoticon.is_cancel
      ? 'DELETE'
      : ('CREATE' as (typeof EventType)[number]),
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
     * 别野编号
     */
    guild_id: String(villa_id),
    /**
     * 房间编号
     */
    channel_id: String(room_id),
    /**
     * 消息原文
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
