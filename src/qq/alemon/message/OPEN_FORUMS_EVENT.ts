import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import { typeMessage, AMessage, PlatformEnum } from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'

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
    event: 'FORUMS_THREAD',
    eventType: 'CREATE',
    boundaries: 'publick',
    attribute: 'group',
    bot: getBotMsgByQQ(),
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    attachments: [],
    specials: [JSON.parse(event.msg.thread_info.content)]
  } as AMessage

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
