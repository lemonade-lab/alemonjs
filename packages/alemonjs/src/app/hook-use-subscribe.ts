import { EventCycle, Next, Current, Events } from '../typings'
import { SinglyLinkedList } from '../datastructure/SinglyLinkedList'

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
    if (!alemonjsCore.storeSubscribeList[chioce][select]) {
      alemonjsCore.storeSubscribeList[chioce][select] = new SinglyLinkedList()
    }
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
    alemonjsCore.storeSubscribeList[chioce][select].append({ keys: values, current: callback })
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
