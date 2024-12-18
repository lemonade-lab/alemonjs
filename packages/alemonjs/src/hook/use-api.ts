import { readFileSync } from 'fs'
import { DataEnums, DataParseType, ParseType } from './message-typing'
import { AEvents } from '../env'

export * from './message-format'

type ApiUseSend = (event: { [key: string]: any }, val: DataEnums[]) => Promise<any[]>

/**
 * 全局声明
 */
declare global {
  var alemonjs: {
    api: {
      use: {
        send: ApiUseSend
      }
    }
  }
  var storeoberver: {
    [key: string]: {
      event: {
        [key: string]: string
      }
      current: Function
    }[]
  }
}

/**
 * 解析返回指定类型
 * @param event 事件类型
 * @param value 值数组
 * @returns 解析后的值
 */
export const useParse = <T extends keyof DataParseType>(
  value: {
    MessageBody: DataParseType[T][]
  },
  event: T
): ParseType[T] | undefined => {
  const msgs = value.MessageBody.filter(item => item.type === event)
  if (msgs.length === 0) return undefined
  switch (event) {
    case 'Text': {
      return (msgs as DataParseType['Text'][]).map(item => item.value).join('')
    }
    case 'Image': {
      const d: Buffer[] = []
      for (const item of msgs as DataParseType['Image'][]) {
        if (item.typing === 'buffer') {
          d.push(item.value as Buffer)
        }
        // 如果是url。或者是本地文件
        if (item.typing === 'file') {
          const m = readFileSync(item.value, 'utf-8')
          d.push(Buffer.from(readFileSync(m)))
        }
      }
      return d.length > 0 ? d : undefined
    }
    case 'At': {
      return msgs as DataParseType['At'][]
    }
    default:
      return undefined
  }
}

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
    if (!global.storeoberver) global.storeoberver = {}
    if (!global.storeoberver[option]) global.storeoberver[option] = []
    let i = 0
    const next = () => {
      if (i >= global.storeoberver[option].length) {
        // 如果不存在。则创建
        global.storeoberver[option][i] = { event: v, current: callback }
        return
      }
      i++
      // 是空的。占据位置。
      if (!global.storeoberver[option][i]) {
        global.storeoberver[option][i] = { event: v, current: callback }
      } else {
        // 不是空的。继续
        next()
      }
    }
    next()
    return
  }
}
