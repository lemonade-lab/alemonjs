/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventKeys } from '../types';
import { MiddlewareTree, MiddlewareRouter } from './store';
import { createCallHandler } from './event-processor-callHandler';
import { createFileTreeStep } from './event-processor-cycleFiles';
import { createRouteProcessChildren } from './event-processor-cycleRoute';

// 单例，避免每次事件处理都创建新对象
const middlewareTreeSingleton = new MiddlewareTree();
const middlewareRouterSingleton = new MiddlewareRouter();

/**
 * 处理中间件
 * @param event
 * @param select
 */
export const expendMiddleware = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  // 得到中间件文件树
  const root = middlewareTreeSingleton.value;
  // 创建处理函数（文件）
  const callHandler = createCallHandler(valueEvent);
  // 创建文件树遍历函数
  const nextMiddleware = createFileTreeStep(valueEvent, select, next, root, callHandler);

  // 所有中间件（路由）
  const routes = middlewareRouterSingleton.value;
  // 创建处理函数（路由）
  const callRouteHandler = createCallHandler(valueEvent);
  // 创建 children 处理函数（路由）
  const processChildren = createRouteProcessChildren(valueEvent, select, nextMiddleware, callRouteHandler);

  // 优先route系统。再到files系统
  void processChildren(routes, [], nextMiddleware);
};
