import { OnResponseReversalFunc, OnResponseFunc } from '../typings'

/**
 * 处理响应事件
 * @param callback 回调函数，处理事件和 API
 * @param event 事件类型
 * @param reg
 * @returns 回调函数的执行结果
 */
export const onResponse: OnResponseReversalFunc = (select, callback) => {
  return { current: callback, select }
}

global.onResponse = onResponse

/**
 * 废弃，请使用 onResponse
 * @deprecated
 */
export const OnResponse: OnResponseFunc = (callback, select) => {
  return { current: callback, select }
}

global.OnResponse = OnResponse
