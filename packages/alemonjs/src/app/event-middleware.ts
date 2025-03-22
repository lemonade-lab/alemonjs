/**
 * @fileoverview 中间件
 * @module middleware
 * @author ningmengchongshui
 */
import { OnMiddlewareReversalFunc, OnMiddlewareFunc } from '../typings'
/**
 * 中间件
 * @param select 事件选择
 * @param callback 回调函数，处理事件和 API
 * @returns
 */
export const onMiddleware: OnMiddlewareReversalFunc = (select, callback) => ({
  select,
  current: callback
})
global.onMiddleware = onMiddleware

/**
 * 废弃，请使用 onMiddleware
 * @deprecated
 */
export const OnMiddleware: OnMiddlewareFunc = (callback, select) => ({ select, current: callback })
global.OnMiddleware = OnMiddleware
