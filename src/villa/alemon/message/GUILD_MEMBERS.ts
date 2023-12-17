import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import {
  typeMessage,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption,
  type PlatformEnum
} from '../../../core/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import {
  ClientControllerOnMember,
  ClientControllerOnMessage
} from '../controller.js'

/**
 * 成员进入
 * @param event 回调数据
 */
export async function GUILD_MEMBERS(event: {
  robot: {
    template: {
      id: string
      name: string
      desc: string
      icon: string
      customSettings: any[]
      commands: Array<{
        name: string // 指令
        desc: string // 指令说明
      }>
    }
    villaId: number
  }
  type: number
  extendData: {
    joinVilla: {
      joinUid: number // 用户编号
      joinUserNickname: string // 用户名称
      joinAt: number // 进入事件编号
      villaId: number // 别野编号
    }
  }
  createdAt: number
  id: string
  sendAt: number
}) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const JoinVilla = event.extendData.joinVilla

  const cfg = getBotConfigByKey('villa')
  const masterID = cfg.masterID

  const msg_id = `${event.id}.${JoinVilla.joinAt}`

  const Message = ClientControllerOnMessage({
    guild_id: JoinVilla.villaId,
    channel_id: 0,
    msg_id: msg_id
  })

  const Member = ClientControllerOnMember({
    guild_id: JoinVilla.villaId,
    user_id: String(event.extendData.joinVilla.joinUid)
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    event: 'GUILD_MEMBERS' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: masterID == String(JoinVilla.joinUid),
    guild_id: String(JoinVilla.villaId),
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
    msg_id: msg_id,
    msg_txt: '',
    open_id: '',

    //
    user_avatar: '', // dodo 可以通过 请求权限获得
    user_id: String(event.extendData.joinVilla.joinUid),
    user_name: event.extendData.joinVilla.joinUserNickname,
    send_at: JoinVilla.joinAt,
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
      select?: MessageBingdingOption
    ): Promise<any> => {
      if (select?.open_id && select?.open_id != '') {
        console.error('VILLA 无私信')
        return false
      }
      const villaId = select?.guild_id ?? JoinVilla.villaId
      const roomId = select?.channel_id ?? false
      if (!roomId) return false
      return await replyController(villaId, roomId, msg, {
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
    .then(() => AlemonJSEventLog(e.event, e.typing))
    .catch(err => AlemonJSEventError(err, e.event, e.typing))
}
