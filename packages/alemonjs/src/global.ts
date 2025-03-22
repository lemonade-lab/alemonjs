import {
  DefinePlatformFunc,
  DefineChildrenFunc,
  OnMiddlewareFunc,
  OnResponseFunc,
  OnResponseReversalFunc,
  OnMiddlewareReversalFunc
} from './typing/event'
import { ClientAPI } from './typing/client'
import {
  StoreMiddleware,
  StoreMiddlewareItem,
  StoreResponse,
  StoreResponseItem
} from './typing/store/res'
import { StateSubscribeMap, SubscribeKeysMap } from './typing/subscribe'
import { LoggerUtils } from './typing/logger/index'
import { ResponseState } from './typing/state'
import { Core, Logger } from './app/store'

declare global {
  /**
   * 打印
   */
  var logger: LoggerUtils
  /**
   * 核心
   */
  var alemonjsCore: {
    /**
     * 状态
     */
    storeState: ResponseState
    /**
     * 状态订阅
     */
    storeStateSubscribe: StateSubscribeMap
    // /**
    //  * 主函数
    //  */
    // storeMains: string[]
    /**
     * 订阅列表
     */
    storeSubscribeList: SubscribeKeysMap
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
    /**
     *
     */
    storeActionsBus: any
  }
  /**
   * 客户端
   */
  var alemonjsBot: ClientAPI
  /**
   * 废弃，请使用 onResponse
   * @deprecated
   */
  var OnResponse: OnResponseFunc
  /**
   * 定义响应体
   */
  var onResponse: OnResponseReversalFunc
  /**
   * 废弃,请使用 onMiddleware
   * @deprecated
   */
  var OnMiddleware: OnMiddlewareFunc
  /**
   * 定义中间件
   */
  var onMiddleware: OnMiddlewareReversalFunc
  /**
   * 定义一个子模块
   */
  var defineChildren: DefineChildrenFunc
  /**
   * 废弃，请使用 definePlatform
   * @deprecated
   */
  var defineBot: DefinePlatformFunc
  /**
   * 定义一个平台
   */
  var definePlatform: DefinePlatformFunc
}

// 初始化日志
export const logger = new Logger().value

// 初始化核心数据
export const core = new Core().value
