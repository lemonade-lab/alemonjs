/**
 * @fileoverview 观察者
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents } from '../typing/event/map'
/**
 *  观察者
 * @param event
 * @param select
 * @param next
 */
export const expendObserver = async <T extends keyof AEvents>(
  valueEvent: AEvents[T],
  select: T,
  next: Function
) => {
  // 确保订阅初始化。
  if (!global.storeObserver[select]) global.storeObserver[select] = []
  //
  let valueN = 0
  /**
   * 观察者下一步
   * @returns
   */
  const nextObserver = () => {
    // i 结束了
    if (valueN >= global.storeObserver[select].length) {
      // 订阅都检查过一遍。开始 next
      next()
      return
    }
    //
    valueN++

    const item = global.storeObserver[select][valueN - 1]
    // 不存在
    if (!item) {
      // 继续 next
      nextObserver()
      return
    }

    // 存在
    for (const key in item.event) {
      // 只要发现不符合的，就继续
      if (item.event[key] !== valueEvent[key]) {
        // 不符合。继续 next。
        nextObserver()
        return
      }
    }

    // 设置为 undefined
    global.storeObserver[select][valueN - 1] = undefined

    // 观察者的 next 是 Continue

    // 放回来
    const Continue = () => {
      global.storeObserver[select][valueN - 1] = item
    }

    //
    item.current(valueEvent, Continue)
  }

  // 先从观察者开始
  nextObserver()
}
