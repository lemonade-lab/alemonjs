/**
 * @fileoverview 中间件
 * @module middleware
 * @author ningmengchongshui
 */
import { OnMiddlewareReversalFunc, OnMiddlewareFunc } from '../typings'
/**
 * 中间件
 * @param callback
 * @param select
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
