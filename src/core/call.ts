import { AMessage, EventEnum } from './typings.js'
import lodash from 'lodash'

/**
 * 回调系统
 */
type CallType = {
  [Event in (typeof EventEnum)[number]]: {
    priority: number
    call: (e: AMessage) => any
  }[]
}

const CALL = {
  AUDIO_FREQUENCY: [],
  AUDIO_MICROPHONE: [],
  CHANNEL: [],
  FORUMS_POST: [],
  FORUMS_REPLY: [],
  FORUMS_THREAD: [],
  GUILD: [],
  GUILD_BOT: [],
  GUILD_MEMBERS: [],
  GUILD_MESSAGE_REACTIONS: [],
  INTERACTION: [],
  MESSAGES: [],
  message: []
} as CallType

/**
 * 排序回调
 */
export function orderByAppCall() {
  // 排序
  for (const val in CALL) {
    CALL[val] = lodash.orderBy(CALL[val], ['priority'], ['asc'])
  }
}

/**
 * 得到回调
 * @returns
 */
export function getAppCall(event: (typeof EventEnum)[number]) {
  return CALL[event]
}

/**
 * 设置回调
 * @param event
 * @param call
 * @param priority
 */
export function setAllCall(
  event: (typeof EventEnum)[number],
  call: (e: AMessage) => any,
  priority = 9000
) {
  CALL[event].push({
    call,
    priority
  })
}
