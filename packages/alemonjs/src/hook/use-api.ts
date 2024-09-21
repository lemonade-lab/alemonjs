import { readFileSync } from 'fs'
import { AEventByMessageCreate } from '../types'
import { DataParseType, ParseType } from './message-typing'

export * from './message-format'

type k = keyof AEventByMessageCreate

/**
 * 全局声明
 */
declare global {
  var alemonjs: {
    api: {
      use: {
        observer: (fn: Function, arg: k[]) => void
        send: (event, val: any[]) => void
        reply: (event, val: any[]) => void
        withdraw: (event, val: any[]) => void
      }
    }
  }
}

/**
 * 观察消息
 * @param fn
 */
export const useObserver = (fn: Function, arg: k[]) => {
  return global.alemonjs.api.use.observer(fn, arg)
}

/**
 * 发送消息
 */
export const useSend = (event: any) => {
  return (...val: any) => global.alemonjs.api.use.send(event, val)
}

/**
 * 回复消息
 */
export const useReply = (event: any) => {
  return (...val: any) => global.alemonjs.api.use.reply(event, val)
}

/**
 * 撤回消息
 * @param event
 */
export const useWithdraw = (event: any) => {
  return (...val: any) => global.alemonjs.api.use.withdraw(event, val)
}

/**
 * 解析返回指定类型
 * @param event 事件类型
 * @param value 值数组
 * @returns 解析后的值
 */
export const useParse = <T extends keyof DataParseType>(
  value: DataParseType[T][] = [],
  event: T
): ParseType[T] | undefined => {
  const msgs = value.filter(item => item.type === event)
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
    default:
      return undefined
  }
}
