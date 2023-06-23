import { EventEmitter } from 'ws'
import { EType, typeMessage, EventType } from 'alemon'

/* 非依赖引用 */
import { AlemonMsgType } from '../types.js'

declare global {
  //连接对象
  var ws: EventEmitter
}

/**
 * ***********
 * 公域可能已删除公域论坛事件
 * ***********
 */

/**
 * *********
 * todo
 * 该事件需要拆分
 * ***********
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
export const OPEN_FORUMS_EVENT = () => {
  ws.on('OPEN_FORUMS_EVENT', (e: AlemonMsgType) => {
    /* 事件匹配 */
    e.event = EType.FORUMS
    //是公域
    e.isPrivate = false

    if (new RegExp(/CREATE$/).test(e.eventType)) {
      e.eventType = EventType.CREATE
    } else if (new RegExp(/UPDATE$/).test(e.eventType)) {
      e.eventType = EventType.UPDATE
    } else {
      e.eventType = EventType.DELETE
    }

    //只匹配类型
    typeMessage(e)
  })
}
