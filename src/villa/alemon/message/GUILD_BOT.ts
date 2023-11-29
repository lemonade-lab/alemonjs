import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import {
  EventEnum,
  EventType,
  MessageBingdingOption,
  PlatformEnum,
  typeMessage
} from '../../../core/index.js'
import { segmentVILLA } from '../segment.js'
import { replyController } from '../reply.js'
import {
  ClientControllerOnMember,
  ClientControllerOnMessage
} from '../controller.js'

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
      DeleteRobot: {
        villa_id: number // 别野编号
      }
      CreateRobot: {
        villa_id: number // 别野编号
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const EventData = event.extend_data.EventData

  const guild_id =
    event.type == 3
      ? EventData.CreateRobot.villa_id
      : EventData.DeleteRobot.villa_id

  const Message = ClientControllerOnMessage({
    guild_id: guild_id,
    channel_id: 0,
    msg_id: '0'
  })

  const Member = ClientControllerOnMember({
    guild_id: guild_id,
    user_id: event.robot.template.id
  })

  /**
   * 制作e消息对象
   */
  const e = {
    platform: 'villa' as (typeof PlatformEnum)[number],
    event: 'GUILD_BOT' as (typeof EventEnum)[number],
    eventType:
      event.type == 3 ? 'CREATE' : ('DELETE' as (typeof EventType)[number]),
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
    msg_id: `${event.id}.${event.send_at}`,
    msg_txt: '',
    open_id: '',

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
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
      select?: MessageBingdingOption
    ): Promise<any> => {
      if (select?.open_id && select?.open_id != '') {
        console.error('VILLA 无私信')
        return false
      }
      const villa_id = select?.guild_id ?? guild_id
      const room_id = select?.channel_id ?? false
      if (!room_id) return false
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
