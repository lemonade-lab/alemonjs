import { EventCycleEnum, Current, Events, EventKeys } from '../typings'
import { ResultCode } from '../core/code'
import { SubscribeList } from './store'

type KeyMap = {
  [key: string]: string | number | boolean
}

/**
 * 使用订阅
 * @param event
 * @param option
 * @throws {Error} - 如果 event 不是对象，或者 select 不是字符串，抛出错误。
 */
export const useSubscribe = <T extends EventKeys>(event: Events[T], select: T) => {
  // 检查参数
  if (typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'event is not object',
      data: null
    })
    throw new Error('event is not object')
  }
  if (typeof select !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'select is not string',
      data: null
    })
    throw new Error('select is not string')
  }

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
