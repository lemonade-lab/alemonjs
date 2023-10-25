import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import { AMessage, typeMessage } from '../../../core/index.js'
import { BotEvent } from '../../sdk/index.js'
import { segmentVilla } from '../segment.js'
import { now_e } from './e.js'
/**
 * 表情表态
 * @param event 回调数据
 * @param val  类型控制
 */
export async function GUILD_MESSAGE_REACTIONS_VILLA(event: BotEvent) {
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
    platform: 'villa',
    boundaries: 'publick',
    attribute: 'group',
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
    event: 'GUILD_MESSAGE_REACTIONS',
    /**
     * 消息类型 ： 存在则为撤回
     */
    eventType: event.extend_data.EventData.AddQuickEmoticon.is_cancel
      ? 'DELETE'
      : 'CREATE',
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
    segment: segmentVilla,
    /**
     * 用户头像
     */
    user_avatar: '',
    ...now_e,
    reply: async (
      msg: Buffer | string | (Buffer | string)[],
      select?: {
        quote?: string
        withdraw?: number
      }
    ): Promise<any> => {
      return false
    }
  } as AMessage

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
