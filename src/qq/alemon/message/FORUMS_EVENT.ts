import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import { typeMessage, AMessage } from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'

/**
 * ***********
 * THREAD  主题  FORUMS_THREAD
 * POST   帖子 FORUMS_POST
 * REPLY  评论  FORUMS_REPLY
 */

/**
 * DO
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
export const FORUMS_EVENT = async (event: any) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'FORUMS_THREAD',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: false
  } as AMessage

  /* 事件匹配 */
  if (new RegExp(/^FORUM_THREAD/).test(event.eventType)) {
    e.event = 'FORUMS_THREAD'
  } else if (new RegExp(/^FORUM_POST/).test(event.eventType)) {
    e.event = 'FORUMS_POST'
  } else {
    e.event = 'FORUMS_REPLY'
  }

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
