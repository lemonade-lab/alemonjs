import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { segmentQQ } from '../segment.js'
import { ClientController } from '../controller.js'

/**
 * ***********
 * THREAD  主题  FORUMS_THREAD
 * POST   帖子 FORUMS_POST
 * REPLY  评论  FORUMS_REPLY
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

interface ContentType {
  paragraphs: {
    elems: {
      text: { text: string }
      type: number
    }[]
    props: any
  }[]
}
/**
FORUMS_EVENT (1 << 28)  // 论坛事件，仅 *私域* 机器人能够设置此 intents。

  - FORUM_THREAD_CREATE     // 当用户创建主题时
  - FORUM_THREAD_UPDATE     // 当用户更新主题时
  - FORUM_THREAD_DELETE     // 当用户删除主题时

  - FORUM_POST_CREATE       // 当用户创建帖子时
  - FORUM_POST_DELETE       // 当用户删除帖子时

  - FORUM_REPLY_CREATE      // 当用户回复评论时
  - FORUM_REPLY_DELETE      // 当用户删除评论时

  - FORUM_PUBLISH_AUDIT_RESULT      // 当用户发表审核通过时
 */
export const FORUMS_EVENT = async (event: ForumsEventType) => {
  const Message = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    msg_id: '0',
    send_at: new Date().getTime()
  })

  const content: ContentType = JSON.parse(event.msg.thread_info.content)

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: new RegExp(/^FORUM_THREAD/).test(event.eventType)
      ? 'FORUMS_THREAD'
      : new RegExp(/^FORUM_POST/).test(event.eventType)
      ? 'FORUMS_POST'
      : ('FORUMS_REPLY' as (typeof EventEnum)[number]),
    eventType: new RegExp(/CREATE$/).test(event.eventType)
      ? 'CREATE'
      : new RegExp(/UPDATE$/).test(event.eventType)
      ? 'UPDATE'
      : ('DELETE' as (typeof EventType)[number]),
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: false,
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
    attachments: [],
    specials: [content],
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
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {},
    Message
  }

  return await typeMessage(e)
    .then(() => AlemonJSEventLog(e.event, e.eventType))
    .catch(err => AlemonJSEventError(err, e.event, e.eventType))
}
