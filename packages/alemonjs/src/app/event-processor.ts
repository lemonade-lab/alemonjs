import { Events } from '../typing/event/map'
import { expendCycle } from './event-processor-cycle'

const eventStore = new Map()
const userStore = new Map()

const EVENT_INTERVAL = Number(process.env?.ALEMONJS_EVENT_INTERVAL ?? 0) || 1000
const USER_INTERVAL = Number(process.env?.ALEMONJS_USER_INTERVAL ?? 0) || 500

/**
 * 清理旧消息
 */
const cleanupStore = ({ Now, store, INTERVAL }) => {
  for (const [ID, timestamp] of store.entries()) {
    // 超过时间间隔
    if (Now - timestamp > INTERVAL) {
      // 删除
      store.delete(ID)
    }
  }
}

const filter = ({ Now, store, INTERVAL }, MessageId: string) => {
  if (store.has(MessageId)) {
    const time = store.get(MessageId)
    if (Now - time < INTERVAL) {
      // 1s内重复消息
      store.set(MessageId, Date.now())
      return true
    }
  }
  store.set(MessageId, Date.now())
  // 清理旧消息
  cleanupStore({ Now, INTERVAL: EVENT_INTERVAL, store: eventStore })
}

/**
 * 消息处理器
 * @param event
 * @param name
 * @returns
 */
export const OnProcessor = <T extends keyof Events>(event: Events[T], name: T) => {
  // 不再消息匹配
  event['name'] = name
  const Now = Date.now()
  // 同一个消息。1s内不再处理
  if (event['MessageId']) {
    if (filter({ Now, INTERVAL: EVENT_INTERVAL, store: eventStore }, event.MessageId)) {
      return
    }
  }
  // 用一个用户。0.5s内不再处理
  if (event['UserId']) {
    if (filter({ Now, INTERVAL: USER_INTERVAL, store: userStore }, event['UserId'])) {
      return
    }
  }
  expendCycle(event, name)
  return
}
