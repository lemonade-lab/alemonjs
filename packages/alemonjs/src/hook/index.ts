import { AEventByMessageCreate } from '../types'

export * from './message'

type k = keyof AEventByMessageCreate

/**
 * 观察消息
 * @param fn
 */
export const useObserver = (fn: Function, arg: k[]) => {
  //
}

/**
 * 发送消息
 */
export const useSend = (...val: any) => {
  //
}

/**
 * 回复消息
 */
export const useReply = (...val: any) => {
  //
}

/**
 * 撤回消息
 * @param event
 */
export const useWithdraw = event => {
  //
}

/**
 * 解析返回指定类型
 * @param event
 * @param value
 */
export const Parse = (event: 'Text' | 'Img', value: any) => {}
