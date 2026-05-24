import type {
  DefineChildrenFunc,
  OnResponseReversalFunc,
  OnMiddlewareReversalFunc,
  OnSelectsFunc,
  OnDataFormatFunc,
  OnResponseReversalFuncBack,
  OnGroupFunc,
  OnMiddlewareReversalFuncBack,
  DefineResponseFunc,
  defineMiddlewareFunc,
  DefineRouterFunc,
  StoreChildrenApp,
  StateSubscribeMap,
  SubscribeKeysMap,
  LoggerUtils,
  ResponseState,
  StartOptions
} from './types';

import { type Server } from 'ws';
import type WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import type KoaRouter from 'koa-router';
import type { RuntimeAppRecord } from './application/runtime/store.js';

declare global {
  /**
   * 全局配置实例
   */

  var __config: any;
  /**
   * 全局启动参数
   */
  var __options: StartOptions;
  /**
   * 当前进程是否为 sandbox/testone 模式
   */
  var __sandbox: boolean | undefined;
  /**
   * 客户端运行时兼容初始化标记
   */
  var __client_loaded: boolean | undefined;
  /**
   * 平台 bootstrap 初始化标记
   */
  var __platform_bootstrap_loaded: boolean | undefined;
  /**
   * 缓存的公网 IP
   */
  var __publicIp: string | undefined;
  /**
   * 打印
   */
  var logger: LoggerUtils;
  /**
   * 核心
   */
  var alemonjsCore: {
    /**
     * 状态
     */
    storeState: ResponseState;
    /**
     * 状态订阅
     * @deprecated 废弃。指令管理可直接配置禁用正则
     */
    storeStateSubscribe: StateSubscribeMap;
    /**
     * 订阅列表
     */
    storeSubscribeList: SubscribeKeysMap;
    /**
     * 子模块
     */
    storeChildrenApp: {
      [key: string]: StoreChildrenApp;
    };
    runtimeApps?: {
      [key: string]: RuntimeAppRecord;
    };
    runtimeAppKoaRouters?: {
      [key: string]: KoaRouter[];
    };
  };
  /**
   * 聊天机器人
   */
  var chatbotServer: Server<typeof WebSocket, typeof IncomingMessage>;
  var chatbotPlatform: WebSocket;
  var chatbotClient: WebSocket;
  /**
   * testone 调试前端 websocket
   */
  var testoneClient: WebSocket | undefined;
  /**
   * 定义响应体
   */
  var onResponse: OnResponseReversalFunc;
  /**
   * 废弃，请使用 onResponse
   * @deprecated
   */
  var OnResponse: OnResponseReversalFuncBack;
  /**
   * 定义中间件
   */
  var onMiddleware: OnMiddlewareReversalFunc;
  /**
   * @deprecated 废弃，请使用 onMiddleware
   */
  var OnMiddleware: OnMiddlewareReversalFuncBack;
  /**
   * 定义一个子模块
   */
  var defineChildren: DefineChildrenFunc;
  /**
   * 定义响应体
   */
  var defineResponse: DefineResponseFunc;
  /**
   * 定义中间件
   */
  var defineMiddleware: defineMiddlewareFunc;
  /**
   * 定义路由
   */
  var defineRouter: DefineRouterFunc;
  /**
   * 定义选择器
   */
  var onSelects: OnSelectsFunc;
  /**
   * 定义数据格式
   * @deprecated 废弃，请使用 Format
   */
  var format: OnDataFormatFunc;
  /**
   * 定义一组标准执行
   * @deprecated 废弃
   */
  var onGroup: OnGroupFunc;
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      login?: string;
      platform?: string;
      port?: string;
      input?: string;
      __ALEMON_PLATFORM_ENTRY?: string;
      __ALEMON_DIRECT_SOCK?: string;
      NODE_ENV?: 'development' | 'production';
    }
  }
}
