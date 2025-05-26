import { EventCycleEnum, Current, Events, EventKeys } from '../typings'
import { ResultCode } from '../core/code'
import { SubscribeList } from './store'

type KeyMap = {
  [key: string]: string | number | boolean
}

/**
 * 订阅事件
 * @param event
 * @param select
 * @returns
 */
export const useSubscribe = <T extends EventKeys>(event: Events[T], selects: T | T[]) => {
  // 检查参数
  if (typeof event !== 'object') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'event is not object',
      data: null
    })
    throw new Error('event is not object')
  }
  if (typeof selects !== 'string' && !Array.isArray(selects)) {
    logger.error({
      code: ResultCode.FailParams,
      message: 'select is not string or array',
      data: null
    })
    throw new Error('select is not string or array')
  }

  type Keys = keyof Events[T]

  /**
   * 运行订阅
   * @param callback
   * @param keys
   * @param choose
   * @returns
   */
  const register = (callback: Current<T>, keys: Keys[], choose: EventCycleEnum) => {
    const curSelects = Array.isArray(selects) ? selects : [selects]
    for (const select of curSelects) {
      // 1. 必得得返回 一个id。好随时卸载。同时内部也能卸载所有的。
      // 2. tudo 待完善。

      // 创建 订阅 列表
      const subList = new SubscribeList(choose, select)
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
        } else {
          logger.warn({
            code: ResultCode.FailParams,
            message: `Invalid key: ${key?.toString()} must be a string, number or boolean`,
            data: null
          })
        }
      }
      subList.value.append({ keys: values, current: callback })
    }
    return ''
  }

  /**
   * res 创建时 运行订阅
   * @param callback
   * @param keys
   */
  const create = (callback: Current<T>, keys: Keys[]) => {
    return register(callback, keys, 'create')
  }

  /**
   * res 挂载时 运行订阅
   * @param callback
   * @param keys
   */
  const mountBefore = (callback: Current<T>, keys: Keys[]) => {
    return register(callback, keys, 'mount')
  }

  /**
   * res 卸载时 运行订阅
   * @param callback
   * @param keys
   */
  const unmount = (callback: Current<T>, keys: Keys[]) => {
    return register(callback, keys, 'unmount')
  }

  const clear = (id: string) => {
    //
  }

  const subscribe = {
    create,
    mount: mountBefore,
    unmount,
    clear
  }

  return [subscribe]
}
