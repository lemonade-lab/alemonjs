import { typeMessage } from 'alemon'
import { EventEnum, EventType, AMessage, PlatformEnum } from 'alemon'
import { getBotMsgByQQ } from '../bot.js'

/**
 * ***********
 * 公域可能已删除公域论坛事件
 * ***********
 */

/**
 * DO
 */

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
export const OPEN_FORUMS_EVENT = async (data: any) => {
  const e = {
    platform: PlatformEnum.qq,
    bot: getBotMsgByQQ(),
    event: EventEnum.FORUMS_THREAD,
    eventType: EventType.CREATE,
    /**
     * 不是私域
     */
    isPrivate: false,
    /**
     * 不是撤回
     */
    isRecall: false
  }

  /**
   * 事件匹配
   */

  if (new RegExp(/^OPEN_FORUM_THREAD/).test(data.eventType)) {
    e.event = EventEnum.FORUMS_THREAD
  } else if (new RegExp(/^OPEN_FORUM_POST/).test(data.eventType)) {
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

  /**
   * 只匹配类型
   */
  await typeMessage(e as AMessage)
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
