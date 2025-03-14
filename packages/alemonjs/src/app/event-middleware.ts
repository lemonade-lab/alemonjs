/**
 * @fileoverview 中间件
 * @module middleware
 * @author ningmengchongshui
 */
import { OnMiddlewareReversalType, OnMiddlewareType } from '../typings'
/**
 * 废弃
 * @deprecated
 */
export const OnMiddleware: OnMiddlewareType = (callback, select) => ({ select, current: callback })
global.OnMiddleware = OnMiddleware

/**
 * 中间件
 * @param callback
 * @param select
 * @returns
 */
export const onMiddleware: OnMiddlewareReversalType = (select, callback) => ({
  select,
  current: callback
})
global.onMiddleware = onMiddleware
