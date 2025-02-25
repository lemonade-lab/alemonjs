import { OnResponseType } from '../typings'

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
