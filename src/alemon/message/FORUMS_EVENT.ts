import { EventEmitter } from 'ws'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { EType, typeMessage } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types.js'

declare global {
  var ws: EventEmitter
}
/**
 * *********
 * todo
 * 该事件需要拆分
 * ***********
 * THREAD  主题
 * POST   帖子
 * REPLY  评论
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
  ws.on(AvailableIntentsEventsEnum.FORUMS_EVENT, (e: AlemonMsgType) => {
    /* 事件匹配 */
    e.event = EType.FORUMS
    //是私域
    e.isPrivate = true
    //只匹配类型
    typeMessage(e)
  })
}
