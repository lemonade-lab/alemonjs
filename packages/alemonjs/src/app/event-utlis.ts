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
 * @param reg
 * @returns 回调函数的执行结果
 */
export const OnResponse: OnResponseType = (callback, select) => {
  return { current: callback, select }
}

global.OnResponse = OnResponse

/**
 *
 * @param callback
 * @param event
 * @returns
 */
export const OnObserver: OnObserverType = (callback, select) => {
  return { current: callback, select }
}
global.OnObserver = OnObserver

/**
 *
 * @param options
 * @returns
 */
export const ResponseConfig: ResponseConfigType = options => options
global.ResponseConfig = ResponseConfig
