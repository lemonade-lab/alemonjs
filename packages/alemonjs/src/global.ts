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
  var logger: LoggerUtils;
  var alemonjsCore: {
    storeState: ResponseState;
    storeStateSubscribe: StateSubscribeMap;
    storeSubscribeList: SubscribeKeysMap;
    storeChildrenApp: {
      [key: string]: StoreChildrenApp;
    };
  };
  var chatbotServer: Server<typeof WebSocket, typeof IncomingMessage>;
  var chatbotPlatform: WebSocket;
  var chatbotClient: WebSocket;
  /**
   * 定义响应体
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var onResponse: OnResponseReversalFunc;
  /**
   * 废弃，请使用 onResponse
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   * @deprecated
   */
  var OnResponse: OnResponseReversalFuncBack;
  /**
   * 定义中间件
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var onMiddleware: OnMiddlewareReversalFunc;
  /**
   * 定义中间件
   * @deprecated
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var OnMiddleware: OnMiddlewareReversalFuncBack;
  /**
   * 定义一个子模块
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var defineChildren: DefineChildrenFunc;
  /**
   * 定义响应体
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var defineResponse: DefineResponseFunc;
  /**
   * 定义中间件
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var defineMiddleware: defineMiddlewareFunc;
  /**
   * 定义选择器
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
   */
  var onSelects: OnSelectsFunc;
  /**
   * 定义数据格式
   * @deprecated 不再推荐使用全局变量，建议通过 import 引入
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
