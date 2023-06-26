import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { EventType, typeMessage } from 'alemon'
import { EType, Messagetype } from 'alemon'

declare global {
  var ws: EventEmitter
}
/**
 * *********
 * todo
 * 该事件需要拆分
 * ***********
 * THREAD  主题  FORUMS_THREAD
 * POST   帖子 FORUMS_POST
 * REPLY  评论  FORUMS_REPLY
 */

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
export const FORUMS_EVENT = () => {
  ws.on(AvailableIntentsEventsEnum.FORUMS_EVENT, (e: Messagetype) => {
    /* 事件匹配 */

    if (new RegExp(/^FORUM_THREAD/).test(e.eventType)) {
      e.event = EType.FORUMS_THREAD
    } else if (new RegExp(/^FORUM_POST/).test(e.eventType)) {
      e.event = EType.FORUMS_POST
    } else {
      e.event = EType.FORUMS_REPLY
    }

    if (new RegExp(/CREATE$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else if (new RegExp(/UPDATE$/).test(e.eventType)) {
      e.eventType = EventType.UPDATE
    } else {
      e.eventType = EventType.DELETE
    }

    //是私域
    e.isPrivate = true
    //只匹配类型
    typeMessage(e)
  })
}
