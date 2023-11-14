import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  AMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'

/**
 * ***********
 * 公域可能已删除公域论坛事件
 * ***********
 * 或权限需要申请
 */

interface ForumsEventType {
  eventType:
    | 'FORUM_THREAD_CREATE'
    | 'FORUM_THREAD_UPDATE'
    | 'FORUM_THREAD_DELETE'
    | 'FORUM_POST_CREATE'
    | 'FORUM_POST_DELETE'
    | 'FORUM_REPLY_CREATE'
    | 'FORUM_REPLY_DELETE'
    | 'FORUM_PUBLISH_AUDIT_RESULT'
  eventId: string
  msg: {
    author_id: string
    channel_id: string
    guild_id: string
    thread_info: {
      content: string // content
      date_time: string
      thread_id: string
      title: string
    }
  }
}

interface content {
  paragraphs: {
    elems: {
      text: { text: string }
      type: number
    }[]
    props: any
  }[]
}

/**
 * ***********
 * THREAD  主题 FORUMS_THREAD
 * POST  帖子 FORUMS_POST
 * REPLY 评论 FORUMS_REPLY
 */

/**
   OPEN_FORUMS_EVENT (1 << 18)      // 论坛事件, 此为公域的论坛事件
  
    - OPEN_FORUM_THREAD_CREATE     // 当用户创建主题时
    - OPEN_FORUM_THREAD_UPDATE     // 当用户更新主题时
    - OPEN_FORUM_THREAD_DELETE     // 当用户删除主题时
  
    - OPEN_FORUM_POST_CREATE       // 当用户创建帖子时
    - OPEN_FORUM_POST_DELETE       // 当用户删除帖子时
    
    - OPEN_FORUM_REPLY_CREATE      // 当用户回复评论时
    - OPEN_FORUM_REPLY_DELETE      // 当用户删除评论时
   */
export const OPEN_FORUMS_EVENT = async (event: ForumsEventType) => {
  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'FORUMS_THREAD' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    attachments: [],
    specials: [JSON.parse(event.msg.thread_info.content)],
    user_id: '',
    user_name: '',
    isMaster: false,
    send_at: new Date().getTime(),
    at_user: undefined,
    user_avatar: '',
    at: false,
    msg_id: '',
    msg_txt: '',
    segment: segmentQQ,
    msg: '',
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
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
    controller: async (select?: {
      msg_id?: string
      send_at?: number
      withdraw?: number
      guild_id?: string
      channel_id?: string
      pinning?: boolean
      forward?: boolean
      horn?: boolean
    }) => {}
  }

  /**
   * 事件匹配
   */

  if (new RegExp(/^OPEN_FORUM_THREAD/).test(event.eventType)) {
    e.event = 'FORUMS_THREAD'
  } else if (new RegExp(/^OPEN_FORUM_POST/).test(event.eventType)) {
    e.event = 'FORUMS_POST'
  } else {
    e.event = 'FORUMS_REPLY'
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

  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
