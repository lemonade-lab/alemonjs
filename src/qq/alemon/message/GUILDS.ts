import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'

/**
 * GUILD 频道
 * CHANNEL 子频道
 */

/**
 * DO
 */

interface EventGuildType {
  eventType: string
  eventId: string
  msg: {
    description: string
    icon: string // 频道 a
    id: string // 频道 id
    joined_at: string // msg_time
    max_members: number
    member_count: number
    name: string // 频道name
    op_user_id: string
    owner: boolean
    owner_id: string
    union_appid: string
    union_org_id: string
    union_world_id: string
  }
}

/**
GUILDS (1 << 0)

  - GUILD_CREATE           // 当机器人加入新guild时
  - GUILD_UPDATE           // 当guild资料发生变更时
  - GUILD_DELETE           // 当机器人退出guild时
  - 
  - CHANNEL_CREATE         // 当channel被创建时
  - CHANNEL_UPDATE         // 当channel被更新时
  - CHANNEL_DELETE         // 当channel被删除时
 */
export const GUILD = async (event: EventGuildType) => {
  const Message = ClientController({
    guild_id: event.msg.id,
    channel_id: '',
    msg_id: ''
  })

  const Member = ClientControllerOnMember({
    guild_id: event.msg.id,
    channel_id: '',
    user_id: ''
  })

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: new RegExp(/^GUILD.*$/).test(event.eventType)
      ? 'GUILD'
      : ('CHANNEL' as (typeof EventEnum)[number]),
    eventType: new RegExp(/CREATE$/).test(event.eventType)
      ? 'CREATE'
      : new RegExp(/UPDATE$/).test(event.eventType)
      ? 'UPDATE'
      : ('DELETE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.msg.id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: '',
    msg_txt: '',

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
      }
    ): Promise<any> => {},
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
