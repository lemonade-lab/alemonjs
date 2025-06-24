/**
 * @fileoverview 中间件
 * @module middleware
 * @author ningmengchongshui
 */
import { OnMiddlewareReversalFunc } from '../typings'
import { ResultCode } from '../core/code'
/**
 * 中间件
 * @param select 事件选择
 * @param callback 回调函数，处理事件和 API
 * @throws {Error} - 如果 select 无效，抛出错误。
 * @throws {Error} - 如果 callback 无效，抛出错误。
 * @returns
 */
export const onMiddleware: OnMiddlewareReversalFunc = (select, callback) => {
  // 参数检查
  if (typeof callback !== 'function') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'Invalid callback: callback must be a function',
      data: null
    })
    throw new Error('Invalid callback: callback must be a function')
  }
  if (typeof select === 'string' || typeof select === 'object') {
    return { current: callback, select }
  }
  logger.error({
    code: ResultCode.FailParams,
    message: 'Invalid select: select must be a string or object',
    data: null
  })
  throw new Error('Invalid select: select must be a string or object')
}
global.onMiddleware = onMiddleware
