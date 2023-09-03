import { EventType } from './types.js'

/**
 * 响应普通消息
 * @param event
 * @returns
 */
export function callBack(event: EventType) {
  // 消息监听
  console.log('message=', event)

  //true表示引用对方的消息
  event.reply('hello world', true)

  return false
}

/**
 * 响应群消息
 */
