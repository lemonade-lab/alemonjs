import { AEvents } from '../types'

type ControllerType = { next: Function; reg: RegExp }

declare global {
  /**
   * 处理响应事件
   */
  var OnResponse: <T extends keyof AEvents>(
    callback: (event: AEvents[T], controller: ControllerType) => any,
    event: T,
    reg?: RegExp
  ) => any
  /**
   * 处理响应事件配置
   */
  var ResponseConfig: (options?: ResponseType) => ResponseType
  /**
   * 事件观察着
   */
  var OnObserver: <T extends keyof AEvents>(
    callback: (event: AEvents[T], controller: ControllerType) => any,
    event: T,
    reg?: RegExp
  ) => any
}

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

global.OnResponse = OnResponse

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
global.OnObserver = OnObserver

type ResponseType = {
  platform?: string
  priority?: number
  enable?: boolean
  reg?: RegExp
}

/**
 *
 * @param options
 * @returns
 */
export const ResponseConfig = (options?: ResponseType) => options
global.ResponseConfig = ResponseConfig
