import { OnObserverType, OnResponseType, ResponseConfigType } from './event-typing'

declare global {
  /**
   * 处理响应事件
   */
  var OnResponse: OnResponseType
  /**
   * 处理响应事件配置
   */
  var ResponseConfig: ResponseConfigType
  /**
   * 事件观察着
   */
  var OnObserver: OnObserverType
}

/**
 * 处理响应事件
 * @param callback 回调函数，处理事件和 API
 * @param event 事件类型
 * @returns 回调函数的执行结果
 */
export const OnResponse: OnResponseType = (callback, event, reg) => {
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
export const OnObserver: OnObserverType = (callback, event, reg) => {
  return { callback, event, reg: reg ?? /(.*)/ }
}
global.OnObserver = OnObserver
/**
 * @deprecated 错误命名。请使用 `OnObserver` 代替此函数。
 * @param callback
 * @param event
 * @param reg
 * @returns
 */
export const OnOberver = OnObserver
global.OnOberver = OnObserver

/**
 *
 * @param options
 * @returns
 */
export const ResponseConfig: ResponseConfigType = options => options
global.ResponseConfig = ResponseConfig
