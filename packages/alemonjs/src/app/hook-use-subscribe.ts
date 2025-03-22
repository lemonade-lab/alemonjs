import { EventCycleEnum, Current, Events, EventKeys } from '../typings'
import { SubscribeList } from './store'

type KeyMap = {
  [key: string]: string | number | boolean
}

/**
 * 使用订阅
 * @param event
 * @param option
 * @returns
 */
export const useSubscribe = <T extends EventKeys>(event: Events[T], select: T) => {
  type Keys = keyof Events[T]
  const run = (callback: Current<T>, keys: Keys[], chioce: EventCycleEnum) => {
    const subList = new SubscribeList(chioce, select)
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
    subList.value.append({ keys: values, current: callback })
    return
  }
  const create = (callback: Current<T>, keys: Keys[]) => {
    run(callback, keys, 'create')
  }
  const mountBefore = (callback: Current<T>, keys: Keys[]) => {
    run(callback, keys, 'mount')
  }
  const unmount = (callback: Current<T>, keys: Keys[]) => {
    run(callback, keys, 'unmount')
  }
  return [create, mountBefore, unmount]
}

/**
 * 使用观察者
 * @param event
 * @param option
 * @returns
 */
export const useObserver = <T extends EventKeys>(event: Events[T], option: T) => {
  const [_, mount] = useSubscribe(event, option)
  return mount
}
