import { EventKeys, Events } from "../../types/event/map.js";
import { ResponseRoute } from "../../types/event/index.js";
import { Next } from "../../types/cycle/index.js";
import "../../types/index.js";
//#region src/application/runtime/event-processor-cycleRoute.d.ts
/**
 * 创建路由处理调用函数
 * @param valueEvent
 * @param select
 * @param nextCycle
 * @param callHandler
 * @returns
 */
declare const createRouteProcessChildren: <T extends EventKeys>(valueEvent: Events[T], select: T, nextCycle: Next, callHandler: (currents: any, nextEvent: any, meta?: {
  appName?: string;
  phase?: 'route';
}) => void, phase: 'route') => (nodes: ResponseRoute[], _pending: any[], next: () => Promise<void> | void) => void;
//#endregion
export { createRouteProcessChildren };