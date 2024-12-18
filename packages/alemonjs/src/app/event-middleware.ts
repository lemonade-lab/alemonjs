/**
 * @fileoverview 中间件处理
 * 在所有机制中都会生效。
 * 即使是在观察者中
 * @module middleware
 * @author ningmengchongshui
 */
import { OnMiddlewareType } from './event-typing'

declare global {
  /**
   * 中间件
   */
  var OnMiddleware: OnMiddlewareType
}

/**
 * @fileoverview 关系型数据库处理模块
 * 获得ioredis时，自动链接
 * @module ioredis
 * @author ningmengchongshui
 *
 * 得到指定目录下的所有 middleware/xx/x/mw.res
 * 当消息来临时。
 * 使用md对 event 进行增强
 *
 */
export const OnMiddleware: OnMiddlewareType = (callback, select) => ({ select, current: callback })
global.OnMiddleware = OnMiddleware
