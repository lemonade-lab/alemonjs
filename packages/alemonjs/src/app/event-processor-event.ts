/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { Next, Events, EventKeys } from '../types';
import { Response, ResponseRouter } from './store';
import { createCallHandler } from './event-processor-callHandler';
import { createNextStep } from './event-processor-cycleFiles';
import { createRouteProcessChildren } from './event-processor-cycleRoute';

/**
 * todo：
 * 当前的局部中间件算法有问题
 * ****
 * 当前仅仅是简单的记录。被关闭的中间件。
 * ****
 * 在一个指令匹配多个 res 的情况下。
 * 会出现多次计算同一个中间件的结果。即 bad case
 * 需要一个缓存机制。
 */

/**
 * 消息体处理机制
 * @param event
 * @param key
 */
export const expendEvent = <T extends EventKeys>(valueEvent: Events[T], select: T, next: Next) => {
  // 创建所有响应体（文件）
  const res = new Response();
  // 得到所有响应体（文件）
  const StoreResponse = res.value;
  // 创建调用函数（文件）
  const callHandler = createCallHandler(valueEvent);
  // 创建next函数（文件）
  const nextEvent = createNextStep(valueEvent, select, next, StoreResponse, callHandler);

  // 得到所有响应体（路由）
  const resRoute = new ResponseRouter();
  // 得到所有响应体（路由）
  const routes = resRoute.value;
  // 创建调用函数（路由）
  const callRouteHandler = createCallHandler(valueEvent);
  // 创建 children 处理函数（路由）
  const processChildren = createRouteProcessChildren(valueEvent, select, nextEvent, callRouteHandler);

  // 开始先处理 路由系统，再到 文件系统
  void processChildren(routes, [], nextEvent);
};
