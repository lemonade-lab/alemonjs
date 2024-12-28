import { DataEnums } from '../typing/message'
import { AEvents } from '../typing/event/map'
import { EventCycle, Next } from '../typing/cycle/index'
import { Current } from '../typing/event'
/**
 *
 * @param event
 * @returns
 */
export const useMention = (event: { [key: string]: any }) => global.alemonjs.api.use.mention(event)

/**
 * 发送消息
 */
export const useSend = (event: { [key: string]: any }) => {
  return (...val: DataEnums[]) => global.alemonjs.api.use.send(event, val)
}

/**
 *
 * @param event
 * @param option
 * @returns
 */
export const useSubscribe = <T extends keyof AEvents>(event: any, select: T) => {
  const run = (callback: Current<T>, keys: (keyof AEvents[T])[], chioce: EventCycle) => {
    // 如果不存在。则创建
    if (!global.storeSubscribe[chioce][select]) global.storeSubscribe[chioce][select] = []

    // 没有选择
    if (keys.length === 0) return

    // 只能选择基础数据类型的key
    const values: {
      [key: string]: string | number | boolean
    } = {}

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
  const create = (callback: Current<T>, keys: (keyof AEvents[T])[]) => {
    run(callback, keys, 'create')
  }
  const mountBefore = (
    callback: (e: AEvents[T], next: Next) => any,
    keys: (keyof AEvents[T])[]
  ) => {
    run(callback, keys, 'mount')
  }
  const unmount = (callback: Current<T>, keys: (keyof AEvents[T])[]) => {
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
export const useObserver = <T extends keyof AEvents>(event: any, option: T) => {
  const [_, mount] = useSubscribe(event, option)
  return mount
}
