import { DefineBot, DefineChildren, OnMiddlewareType, OnResponseType } from './typing/event'
import { ClientAPI } from './typing/global'
import {
  StoreMiddleware,
  StoreMiddlewareItem,
  StoreResponse,
  StoreResponseItem
} from './typing/store/res'
import { Subscribe } from './typing/subscribe'
import { EventsKeyEnum, Logger, ResponseState } from './post'
import { createInitLogger, createLogger } from './logger'
declare global {
  /**
   * 打印
   */
  var logger: Logger
  /**
   * 核心
   */
  var alemonjsCore: {
    /**
     * 状态
     */
    storeState: ResponseState
    /**
     * 主函数
     */
    storeMains: string[]
    /**
     * 订阅列表
     */
    storeSubscribeList: Subscribe
    /**
     * 中间件
     */
    storeMiddleware: StoreMiddlewareItem[]
    /**
     * 响应收集
     */
    storeResponseGather: StoreResponse
    /**
     * 响应
     */
    storeResponse: StoreResponseItem[]
    /**
     * 中间件收集
     */
    storeMiddlewareGather: StoreMiddleware
  }
  var alemonjsBot: ClientAPI
  var OnResponse: OnResponseType
  var OnMiddleware: OnMiddlewareType
  var defineChildren: DefineChildren
  var defineBot: DefineBot
}

/**
 * 初始化全局变量
 * @returns
 */
const initGlobalCore = () => {
  if (global.alemonjsCore) return
  if (!global.alemonjsCore) {
    global.alemonjsCore = {
      storeState: {},
      storeMains: [],
      storeSubscribeList: {
        create: {},
        mount: {},
        unmount: {}
      },
      storeMiddleware: [],
      storeResponse: [],
      storeMiddlewareGather: {} as never,
      storeResponseGather: {} as never
    }
  }
  for (const key of EventsKeyEnum) {
    global.alemonjsCore.storeMiddlewareGather[key] = [] as never
  }
  for (const key of EventsKeyEnum) {
    global.alemonjsCore.storeResponseGather[key] = [] as never
  }
}

const initLogger = () => {
  if (!global.logger) {
    try {
      global.logger = createLogger()
    } catch (e) {
      console.error(e)
      // 扩展 fatal, mark
      global.logger = createInitLogger()
    }
  }
}

// 初始化日志
initLogger()
// 开始初始化
initGlobalCore()
