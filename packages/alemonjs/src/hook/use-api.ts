import { DataEnums } from '../typing/message'
import { AEvents } from '../typing/event/map'

export * from './message-format'

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
export const useObserver = <T extends keyof AEvents>(event: any, option: T) => {
  return (callback: (e: AEvents[T], next: Function) => any, keys: (keyof AEvents[T])[]) => {
    if (keys.length === 0) return
    // 选取key，丢弃其他值
    const v: {
      [key: string]: string
    } = {}
    for (const key of keys) {
      // key是string
      if (typeof key === 'string' && typeof event[key] === 'string') v[key] = event[key]
    }
    // 如果不存在。则创建
    if (!global.storeObserver) global.storeObserver = {}
    if (!global.storeObserver[option]) global.storeObserver[option] = []
    let i = 0
    const next = () => {
      if (i >= global.storeObserver[option].length) {
        // 如果不存在。则创建
        global.storeObserver[option][i] = { event: v, current: callback }
        return
      }
      i++
      // 是空的。占据位置。
      if (!global.storeObserver[option][i]) {
        global.storeObserver[option][i] = { event: v, current: callback }
      } else {
        // 不是空的。继续
        next()
      }
    }
    next()
    return
  }
}
