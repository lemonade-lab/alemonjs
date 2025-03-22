/**
 * @fileoverview 观察者
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventCycle } from '../typings'
import { SubscribeList } from './store'

/**
 * 处理订阅
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
  const subList = new SubscribeList(chioce, select)
  /**
   * 观察者下一步
   * @returns
   */
  const nextObserver: Next = (cn?: boolean, ...cns: boolean[]) => {
    if (cn) {
      next(...cns)
      return
    }

    const item = subList.value.popNext() // 弹出下一个节点

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
    subList.value.removeCurrent() // 移除当前节点

    const Continue: Next = (cn?: boolean, ...cns: boolean[]) => {
      // next() 订阅继续
      subList.value.append(item.data) // 重新连接
      if (cn) {
        nextObserver(...cns)
        return
      }
      if (typeof cn === 'boolean') {
        subList.value.removeCurrent() // 移除当前节点
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
