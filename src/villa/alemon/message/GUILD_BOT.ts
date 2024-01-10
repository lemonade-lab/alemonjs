import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import { Controllers } from '../controller.js'

/**
 * 机器人进出
 * @param event 回调数据
 */
export async function GUILD_BOT(event: {
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
    deleteRobot: {
      villaId: number // 别野编号
    }
    createRobot: {
      villaId: number // 别野编号
    }
  }
  createdAt: number
  id: string
  sendAt: number
}) {
  const extendData = event.extendData

  const guild_id =
    event.type == 3
      ? extendData.createRobot.villaId
      : extendData.deleteRobot.villaId

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa',
    event: 'GUILD_BOT' as (typeof EventEnum)[number],
    typing:
      event.type == 3 ? 'CREATE' : ('DELETE' as (typeof TypingEnum)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: {
      id: event.robot.template.id,
      name: event.robot.template.name,
      avatar: event.robot.template.icon
    },
    isMaster: false,
    guild_id: String(guild_id),
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    attachments: [],
    specials: [],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: `${event.id}.${event.sendAt}`,
    msg_txt: '',
    quote: '',
    open_id: '',

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
    //
    send_at: event.sendAt,
    segment: segmentVILLA,
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
      const villaId = select?.guild_id ?? guild_id
      const roomId = select?.channel_id ?? false
      if (!roomId) return false
      return await replyController(villaId, roomId, msg, {
        quote: select?.quote
      })
    },
    Controllers
  }
  APPS.responseEventType(e)
  return
}
