/**
 * @fileoverview 中间件
 * @module middleware
 * @author ningmengchongshui
 */
import { OnMiddlewareType } from '../typings'
/**
 *
 * @param callback
 * @param select
 * @returns
 */
export const OnMiddleware: OnMiddlewareType = (callback, select) => ({ select, current: callback })
global.OnMiddleware = OnMiddleware
