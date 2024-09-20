import { AEvents } from '../types'

type ControllerType = { next: Function; close: Function; reg: RegExp }

/**
 * 处理响应事件
 * @param callback 回调函数，处理事件和 API
 * @param event 事件类型
 * @returns 回调函数的执行结果
 */
export const OnResponse = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: ControllerType) => any,
  event: T,
  reg?: RegExp
): any => {
  return { callback, event, reg: reg ?? /(.*)/ }
}

/**
 *
 * @param callback
 * @param event
 * @param reg
 * @returns
 */
export const OnObserver = <T extends keyof AEvents>(
  callback: (event: AEvents[T], controller: ControllerType) => any,
  event: T,
  reg?: RegExp
): any => {
  return { callback, event, reg: reg ?? /(.*)/ }
}

/**
 *
 * @param options
 * @returns
 */
export const ResponseConfig = (options?: {
  // 平台
  platform?: string
  // 优先级
  priority?: number
  // 是否开启
  enable?: boolean
  // 正则
  reg?: RegExp
}) => {
  return options
}
