import { Events } from '../typing/event/map'
import { EventCycle, Next } from '../typing/cycle/index'
import { Current } from '../typing/event'

type KeyMap = {
  [key: string]: string | number | boolean
}

/**
 *
 * @param event
 * @param option
 * @returns
 */
export const useSubscribe = <T extends keyof Events>(event: any, select: T) => {
  const run = (callback: Current<T>, keys: (keyof Events[T])[], chioce: EventCycle) => {
    // 如果不存在。则创建
    if (!global.storeSubscribe[chioce][select]) global.storeSubscribe[chioce][select] = []

    // 没有选择
    if (keys.length === 0) return

    // 只能选择基础数据类型的key
    const values: KeyMap = {}

    for (const key of keys) {
      if (
        typeof key === 'string' &&
        (typeof event[key] == 'string' ||
          typeof event[key] == 'number' ||
          typeof event[key] == 'boolean')
      ) {
        values[key] = event[key]
      }
    }
    // 推送订阅
    global.storeSubscribe[chioce][select].push({ keys: values, current: callback })
    return
  }
  const create = (callback: Current<T>, keys: (keyof Events[T])[]) => {
    run(callback, keys, 'create')
  }
  const mountBefore = (callback: (e: Events[T], next: Next) => any, keys: (keyof Events[T])[]) => {
    run(callback, keys, 'mount')
  }
  const unmount = (callback: Current<T>, keys: (keyof Events[T])[]) => {
    run(callback, keys, 'unmount')
  }
  return [create, mountBefore, unmount]
}

/**
 *
 * @param event
 * @param option
 * @returns
 */
export const useObserver = <T extends keyof Events>(event: any, option: T) => {
  const [_, mount] = useSubscribe(event, option)
  return mount
}
