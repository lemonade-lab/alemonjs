/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventKeys } from '../types';
import { ResponseRouter, ResponseTree } from './store';
import { createCallHandler } from './event-processor-callHandler';
import { createFileTreeStep } from './event-processor-cycleFiles';
import { createRouteProcessChildren } from './event-processor-cycleRoute';

// 单例，避免每次事件处理都创建新对象
const responseTreeSingleton = new ResponseTree();
const responseRouterSingleton = new ResponseRouter();

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  // 得到文件响应体树
  const root = responseTreeSingleton.value;
  // 创建调用函数（文件）
  const callHandler = createCallHandler(valueEvent);
  // 创建文件树遍历函数（中间件在树层级只执行一次）
  const nextEvent = createFileTreeStep(valueEvent, select, next, root, callHandler);

  // 得到所有响应体（路由）
  const routes = responseRouterSingleton.value;
  // 创建调用函数（路由）
  const callRouteHandler = createCallHandler(valueEvent);
  // 创建 children 处理函数（路由）
  const processChildren = createRouteProcessChildren(valueEvent, select, nextEvent, callRouteHandler);

  // 开始先处理 路由系统，再到 文件系统
  void processChildren(routes, [], nextEvent);
};
