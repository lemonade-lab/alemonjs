import { Result } from "../../common/result.js";
import { EventKeys, Events } from "../../types/event/map.js";
import { EventErrorPhase, EventTraceReason } from "../../types/cycle/index.js";
import "../../types/index.js";
import "../../common/index.js";
//#region src/application/runtime/hook-event-context.d.ts
/**
 * 在当前异步调用链中绑定事件上下文。
 */
declare const withEventContext: <T extends EventKeys, R>(event: Events[T], next: (...args: boolean[]) => void, runner: () => R, options?: {
  appName?: string;
  phase?: EventErrorPhase;
}) => R;
/**
 * 为当前消息处理创建一条带计时的上下文链。
 */
declare const withProcessorTrace: <T extends EventKeys, R>(select: T, event: Events[T], runner: () => R) => R;
/**
 * 读取当前异步调用链中的事件上下文。
 */
declare const getCurrentEvent: <T extends EventKeys>() => Events[T] | undefined;
/**
 * 读取当前异步调用链中的 next 回调。
 */
declare const getCurrentNext: () => ((...args: boolean[]) => void) | undefined;
/**
 * 读取当前异步调用链中的 appName。
 */
declare const getCurrentAppName: () => string | undefined;
/**
 * 读取当前异步调用链中的错误阶段。
 */
declare const getCurrentPhase: () => EventErrorPhase | undefined;
/**
 * 结束当前消息处理计时。
 */
declare const finishCurrentTrace: (reason: EventTraceReason) => void;
/**
 * 标记当前事件至少尝试过一次消息发送。
 */
declare const markEventSendAttempt: <T extends EventKeys>(event?: Events[T]) => void;
/**
 * 标记当前事件至少成功发送过一次消息。
 */
declare const markEventSendSuccess: <T extends EventKeys>(event?: Events[T]) => void;
/**
 * 标记当前事件最近一次消息发送失败。
 */
declare const markEventSendFailure: <T extends EventKeys>(error: unknown, event?: Events[T]) => void;
/**
 * 根据发送结果自动更新当前事件的发送状态。
 */
declare const recordEventSendResults: <T extends EventKeys>(results: Result[], event?: Events[T]) => void;
/** Register synchronous resource cleanup independently of log visibility. */
declare const onCurrentEventFinished: (cleanup: () => void) => boolean;
//#endregion
export { finishCurrentTrace, getCurrentAppName, getCurrentEvent, getCurrentNext, getCurrentPhase, markEventSendAttempt, markEventSendFailure, markEventSendSuccess, onCurrentEventFinished, recordEventSendResults, withEventContext, withProcessorTrace };