import { OnResponseReversalFunc, OnResponseFunc } from '../typings'
import { ResultCode } from '../core/code'

/**
 * 处理响应事件
 * @param select 事件选择
 * @param callback 回调函数，处理事件和 API
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
  logger.warn({
    code: ResultCode.Warn,
    message: 'OnResponse is deprecated, please use onResponse',
    data: null
  })
  return { current: callback, select }
}

global.OnResponse = OnResponse
