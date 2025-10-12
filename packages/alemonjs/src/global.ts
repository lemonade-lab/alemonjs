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
  StoreChildrenApp,
  StateSubscribeMap,
  SubscribeKeysMap,
  LoggerUtils,
  ResponseState
} from './types';

import WebSocket, { Server } from 'ws';
import { IncomingMessage } from 'http';

declare global {
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
  };
  /**
   * 聊天机器人
   */
  var chatbotServer: Server<typeof WebSocket, typeof IncomingMessage>;
  var chatbotPlatform: WebSocket;
  var chatbotClient: WebSocket;
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
   * 定义中间件
   * @deprecated
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
   * 定义选择器
   */
  var onSelects: OnSelectsFunc;
  /**
   * 定义数据格式
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
      NODE_ENV?: 'development' | 'production';
    }
  }
}
