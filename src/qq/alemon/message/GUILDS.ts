import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'

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

interface EventChannelType {
  eventType: string
  eventId: string
  msg: {
    application_id?: string // 创建时
    guild_id: string // 频道id
    id: string
    name: string // 频道name
    op_user_id: string
    owner_id: string
    parent_id?: string // 创建时
    permissions?: string // 创建时
    position?: number // 创建时
    private_type: number
    speak_permission: number
    sub_type: number
    type: number
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
export const GUILDS = async Event => {
  /**
   * 事件匹配
   */
  if (new RegExp(/^GUILD.*$/).test(Event.eventType)) {
    const event: EventGuildType = Event
    const e = {
      platform: 'qq' as (typeof PlatformEnum)[number],
      event: 'GUILD' as (typeof EventEnum)[number],
      eventType: 'CREATE' as (typeof EventType)[number],
      boundaries: 'publick' as 'publick' | 'private',
      attribute: 'group' as 'group' | 'single',
      bot: getBotMsgByQQ(),
      isPrivate: false,
      isRecall: false,
      isGroup: false,
      attachments: [],
      specials: [],
      send_at: new Date().getTime(),
      user_id: '',
      user_name: '',
      isMaster: false,
      user_avatar: '',
      at: false,
      msg_id: '',
      msg_txt: '',
      segment: segmentQQ,
      at_user: undefined,
      msg: '',
      guild_id: event.msg.id, // ?
      at_users: [],
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
          guild_id?: string
          channel_id?: string
        }
      ): Promise<any> => {},
      withdraw: async (select?: {
        guild_id?: string
        channel_id?: string
        msg_id?: string
        send_at?: number
      }) => {}
    }

    /**
     * 类型匹配
     */
    if (new RegExp(/CREATE$/).test(event.eventType)) {
      e.eventType = 'CREATE'
    } else if (new RegExp(/UPDATE$/).test(event.eventType)) {
      e.eventType = 'UPDATE'
    } else {
      e.eventType = 'DELETE'
    }

    /**
     * 事件匹配
     */
    if (new RegExp(/^GUILD.*$/).test(event.eventType)) {
      e.event = 'GUILD'
    } else {
      e.event = 'CHANNEL'
    }

    /**
     * 只匹配类型
     */
    return await typeMessage(e)
      .then(() => AlemonJSEventLog(e.event, e.eventType))
      .catch(err => AlemonJSEventError(err, e.event, e.eventType))
  }

  const event: EventChannelType = Event

  const e = {
    bot: getBotMsgByQQ(),
    event: 'CHANNEL' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    attachments: [],
    /**
     * 特殊消息
     */
    specials: [],
    send_at: new Date().getTime(),
    platform: 'qq' as (typeof PlatformEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    user_id: '',
    user_name: '',
    isMaster: false,
    user_avatar: '',
    at: false,
    msg_id: '',
    msg_txt: '',
    segment: segmentQQ,
    at_user: undefined,
    msg: '',
    guild_id: event.msg.guild_id, // ?
    at_users: [],
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
    withdraw: async () => {}
  }

  /**
   * 类型匹配
   */
  if (new RegExp(/CREATE$/).test(event.eventType)) {
    e.eventType = 'CREATE'
  } else if (new RegExp(/UPDATE$/).test(event.eventType)) {
    e.eventType = 'UPDATE'
  } else {
    e.eventType = 'DELETE'
  }

  /**
   * 只匹配类型
   */
  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
