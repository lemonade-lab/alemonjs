/**
 * @fileoverview 观察者
 * @module processor
 * @author ningmengchongshui
 */
import { Next } from '../global'
import { Events } from '../typing/event/map'
import { EventCycle } from '../typing/cycle/index'

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
  // 确保订阅初始化。
  if (!global.storeSubscribe[chioce][select]) global.storeSubscribe[chioce][select] = []
  //
  let valueN = 0
  /**
   * 观察者下一步
   * @returns
   */
  const nextObserver: Next = (cn, ...cns) => {
    if (cn) {
      next(...cns)
      return
    }

    // i 结束了
    if (valueN >= global.storeSubscribe[chioce][select].length) {
      // 订阅都检查过一遍。开始 next
      next()
      return
    }
    //
    valueN++

    const item = global.storeSubscribe[chioce][select][valueN - 1]

    // 可能是 undefined

    if (!item || !item.current) {
      // 继续 next
      nextObserver()
      return
    }

    // 存在
    for (const key in item.keys) {
      // 只要发现不符合的，就继续
      if (item.keys[key] !== valueEvent[key]) {
        // 只要有一个不符合，就继续
        nextObserver()
        return
      }
    }

    // 订阅是执行则销毁
    global.storeSubscribe[chioce][select][valueN - 1] = undefined
    const Continue: Next = (cn, ...cns) => {
      // next() 订阅继续
      global.storeSubscribe[chioce][select][valueN - 1] = item
      if (cn) {
        nextObserver(...cns)
        return
      }
      if (typeof cn == 'boolean') {
        global.storeSubscribe[chioce][select][valueN - 1] = undefined
        nextObserver(...cns)
        return
      }
    }

    item.current(valueEvent, Continue)
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
