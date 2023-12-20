import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  InstructionMatchingByNotMessage,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'

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
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)

  const Message = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    msg_id: '',
    user_id: ''
  })

  const Member = ClientControllerOnMember({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    user_id: ''
  })

  const e = {
    platform: 'qq',
    event: 'FORUMS_THREAD' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: false,
    attachments: [],
    specials: [JSON.parse(event.msg.thread_info.content)],
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: '',
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: event.msg.guild_id,

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
    Message,
    Member,
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? false
      if (!msg_id) return false
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.user_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: select?.user_id
        })
      }
      const channel_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    }
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
    e.typing = 'CREATE'
  } else if (new RegExp(/UPDATE$/).test(event.eventType)) {
    e.typing = 'UPDATE'
  } else {
    e.typing = 'DELETE'
  }

  return await InstructionMatchingByNotMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.typing))
    .catch(err => AlemonJSEventError(err, e.event, e.typing))
}
