import { EventType, typeMessage } from 'alemon'
import { EventEnum, AMessage, PlatformEnum } from 'alemon'
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
export const FORUMS_EVENT = async (data: any) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    // 麦克风事件
    event: EventEnum.FORUMS_THREAD,
    // 上麦
    eventType: EventType.CREATE,
    // 是私域
    isPrivate: false,
    // 不是撤回
    isRecall: false
  } as AMessage

  /* 事件匹配 */
  if (new RegExp(/^FORUM_THREAD/).test(data.eventType)) {
    e.event = EventEnum.FORUMS_THREAD
  } else if (new RegExp(/^FORUM_POST/).test(data.eventType)) {
    e.event = EventEnum.FORUMS_POST
  } else {
    e.event = EventEnum.FORUMS_REPLY
  }

  if (new RegExp(/CREATE$/).test(data.eventType)) {
    e.eventType = EventType.CREATE
  } else if (new RegExp(/UPDATE$/).test(data.eventType)) {
    e.eventType = EventType.UPDATE
  } else {
    e.eventType = EventType.DELETE
  }

  //只匹配类型
  await typeMessage(e)
    .then(() => {
      console.info(`\n[${e.event}] [${e.eventType}] [${true}]`)
      return true
    })
    .catch(err => {
      console.error(err)
      console.error(`\n[${e.event}] [${e.eventType}] [${false}]`)
      return false
    })
}