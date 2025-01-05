/**
 * @fileoverview 观察者
 * @module processor
 * @author ningmengchongshui
 */
import { Next } from '../global'
import { Events } from '../typing/event/map'
import { EventCycle } from '../typing/cycle/index'
import { SinglyLinkedList } from '../datastructure/SinglyLinkedList'

/**
 * @param valueEvent
 * @param select
 * @param next
 * @param chioce
 */
export const expendSubscribe = async <T extends keyof Events>(
  valueEvent: Events[T],
  select: T,
  next: Function,
  chioce: EventCycle
) => {
  if (!global.storeSubscribeList[chioce][select]) {
    global.storeSubscribeList[chioce][select] = new SinglyLinkedList()
  }

  /**
   * 观察者下一步
   * @returns
   */
  const nextObserver: Next = (cn?: boolean, ...cns: any[]) => {
    if (cn) {
      next(...cns)
      return
    }

    const item = global.storeSubscribeList[chioce][select].popNext() // 弹出下一个节点

    // 可能是 undefined
    if (!item || !item.data.current) {
      // 继续 next
      nextObserver(true)
      return
    }

    // 检查 keys
    for (const key in item.data.keys) {
      // 只要发现不符合的，就继续
      if (item.data.keys[key] !== valueEvent[key]) {
        nextObserver()
        return
      }
    }

    // 订阅是执行则销毁
    global.storeSubscribeList[chioce][select].removeCurrent() // 移除当前节点

    const Continue: Next = (cn?: boolean, ...cns: any[]) => {
      // next() 订阅继续
      global.storeSubscribeList[chioce][select].append(item.data) // 重新连接
      if (cn) {
        nextObserver(...cns)
        return
      }
      if (typeof cn === 'boolean') {
        global.storeSubscribeList[chioce][select].removeCurrent() // 移除当前节点
        nextObserver(...cns)
        return
      }
    }

    item.data.current(valueEvent, Continue)
  }

  // 先从观察者开始
  nextObserver()
}

/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
export const expendSubscribeCreate = async <T extends keyof Events>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  expendSubscribe(valueEvent, select, next, 'create')
}

/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
export const expendSubscribeMount = async <T extends keyof Events>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  expendSubscribe(valueEvent, select, next, 'mount')
}

/**
 *
 * @param valueEvent
 * @param select
 * @param next
 */
export const expendSubscribeUnmount = async <T extends keyof Events>(
  valueEvent: Events[T],
  select: T,
  next: Function
) => {
  expendSubscribe(valueEvent, select, next, 'unmount')
}
