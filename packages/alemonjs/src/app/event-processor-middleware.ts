/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventKeys } from '../types';
import { Middleware, MiddlewareRouter } from './store';
import { createCallHandler } from './event-processor-callHandler';
import { createNextStep } from './event-processor-cycleFiles';
import { createRouteProcessChildren } from './event-processor-cycleRoute';

/**
 * 处理中间件
 * @param event
 * @param select
 */
export const expendMiddleware = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  // 读取所有全局中间件（文件）
  const mw = new Middleware();
  // 所有中间件（文件）
  const mwFiles = mw.value;
  // 创建处理函数（文件）
  const callHandler = createCallHandler(valueEvent);
  // 创建 next 处理函数（文件）
  const nextMiddleware = createNextStep(valueEvent, select, next, mwFiles, callHandler);

  // 读取所有全局中间件（路由）
  const resRoute = new MiddlewareRouter();
  // 所有中间件（路由）
  const routes = resRoute.value;
  // 创建处理函数（路由）
  const callRouteHandler = createCallHandler(valueEvent);
  // 创建 children 处理函数（路由）
  const processChildren = createRouteProcessChildren(valueEvent, select, nextMiddleware, callRouteHandler);

  // 优先route系统。再到files系统
  void processChildren(routes, [], nextMiddleware);
};
