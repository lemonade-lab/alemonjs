import { AEventByMessageCreate } from '../types'

export * from './message'

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
 * @param event
 * @param value
 */
export const useParse = (event: 'Text' | 'Img', value: any[] = []) => {
  if (event === 'Text') {
    const msgs = value.filter(item => item.type == event)
    const msg = msgs.map(item => item.value).join('')
    return msg
  }
  return
}
