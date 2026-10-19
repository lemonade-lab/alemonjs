import { runtimeExecution, trackRuntimeTask } from "../../common/runtime-scope.js";
import { ResultCode } from "../../common/variable.js";
import { getConfigValue } from "../../common/config.js";
import { dispatchEventFinished } from "./lifecycle-callbacks.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";

//#region src/application/runtime/hook-event-context.ts
const eventStore = new AsyncLocalStorage();
const shouldShowLog = (event) => {
	const value = getConfigValue() ?? {};
	if (Array.isArray(value?.logs?.channel_id)) {
		const channelIds = value.logs.channel_id;
		return channelIds.length > 0 && channelIds.includes(event["ChannelId"]);
	}
	return true;
};
const createLogData = (event, select, reason, duration) => {
	const log = {
		Name: select,
		reason,
		duration
	};
	for (const key in event) if (Object.prototype.hasOwnProperty.call(event, key)) {
		const value = event[key];
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") log[key] = value;
	}
	return log;
};
const createLogText = (event, select, reason, duration) => {
	const parts = [
		`[Name:${select}]`,
		`[Reason:${reason}]`,
		`[Duration:${duration}ms]`
	];
	for (const f of [
		"GuildId",
		"ChannelId",
		"UserKey",
		"UserId",
		"MessageId",
		"MessageText"
	]) {
		const v = event[f];
		if (typeof v === "string" && v !== "") parts.push(`[${f}:${v}]`);
	}
	return parts.join("");
};
const createEventTrace = (select) => {
	const trace = {
		select,
		startTime: performance.now(),
		ended: false,
		cleanups: /* @__PURE__ */ new Set(),
		finish(reason) {
			if (trace.ended) return;
			trace.ended = true;
			runtimeExecution.getStore()?.reasons.push(reason);
			for (const cleanup of trace.cleanups) try {
				cleanup();
			} catch {}
			trace.cleanups.clear();
			const event = eventStore.getStore()?.event;
			const duration = Number((performance.now() - trace.startTime).toFixed(2));
			if (!event) return;
			if (shouldShowLog(event)) {
				if (process.env.NODE_ENV === "development") logger.debug({
					code: ResultCode.Ok,
					message: "event processor finished",
					data: createLogData(event, trace.select, reason, duration)
				});
				else logger.info(createLogText(event, trace.select, reason, duration));
			}
			trackRuntimeTask(dispatchEventFinished({
				event,
				name: trace.select,
				reason,
				duration,
				hasSendAttempted: event._sendAttempted === true || event._has_send_attempt === true,
				hasSendSucceeded: event._sendSucceeded === true || event._has_send_success === true,
				lastSendError: event._lastSendError ?? event._last_send_error ?? null
			}));
		}
	};
	return trace;
};
/**
* 在当前异步调用链中绑定事件上下文。
*/
const withEventContext = (event, next, runner, options) => {
	const current = eventStore.getStore();
	return eventStore.run({
		event,
		next,
		trace: current?.trace,
		appName: options?.appName ?? current?.appName,
		phase: options?.phase ?? current?.phase
	}, runner);
};
/**
* 为当前消息处理创建一条带计时的上下文链。
*/
const withProcessorTrace = (select, event, runner) => {
	const current = eventStore.getStore();
	return eventStore.run({
		event,
		next: current?.next,
		trace: current?.trace ?? createEventTrace(select)
	}, runner);
};
/**
* 读取当前异步调用链中的事件上下文。
*/
const getCurrentEvent = () => {
	return eventStore.getStore()?.event;
};
/**
* 读取当前异步调用链中的 next 回调。
*/
const getCurrentNext = () => {
	return eventStore.getStore()?.next;
};
/**
* 读取当前异步调用链中的 appName。
*/
const getCurrentAppName = () => {
	return eventStore.getStore()?.appName;
};
/**
* 读取当前异步调用链中的错误阶段。
*/
const getCurrentPhase = () => {
	return eventStore.getStore()?.phase;
};
/**
* 结束当前消息处理计时。
*/
const finishCurrentTrace = (reason) => {
	eventStore.getStore()?.trace?.finish(reason);
};
const getTargetEvent = (event) => {
	return event ?? eventStore.getStore()?.event;
};
const setSendAttempted = (target) => {
	target._sendAttempted = true;
	target._has_send_attempt = true;
};
const setSendSucceeded = (target) => {
	target._sendSucceeded = true;
	target._has_send_success = true;
};
const setLastSendError = (target, error) => {
	target._lastSendError = error;
	target._last_send_error = error;
};
/**
* 标记当前事件至少尝试过一次消息发送。
*/
const markEventSendAttempt = (event) => {
	const target = getTargetEvent(event);
	if (!target) return;
	setSendAttempted(target);
};
/**
* 标记当前事件至少成功发送过一次消息。
*/
const markEventSendSuccess = (event) => {
	const target = getTargetEvent(event);
	if (!target) return;
	setSendAttempted(target);
	setSendSucceeded(target);
	setLastSendError(target, null);
};
/**
* 标记当前事件最近一次消息发送失败。
*/
const markEventSendFailure = (error, event) => {
	const target = getTargetEvent(event);
	if (!target) return;
	setSendAttempted(target);
	setLastSendError(target, error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown send error");
};
/**
* 根据发送结果自动更新当前事件的发送状态。
*/
const recordEventSendResults = (results, event) => {
	markEventSendAttempt(event);
	if (Array.isArray(results) && results.some((item) => item?.code === ResultCode.Ok)) {
		markEventSendSuccess(event);
		return;
	}
	const firstError = Array.isArray(results) ? results.find((item) => item?.code !== ResultCode.Ok)?.message : null;
	if (firstError) markEventSendFailure(firstError, event);
};
/** Register synchronous resource cleanup independently of log visibility. */
const onCurrentEventFinished = (cleanup) => {
	const trace = eventStore.getStore()?.trace;
	if (!trace || trace.ended) {
		cleanup();
		return false;
	}
	trace.cleanups.add(cleanup);
	return true;
};

//#endregion
export { finishCurrentTrace, getCurrentAppName, getCurrentEvent, getCurrentNext, getCurrentPhase, markEventSendAttempt, markEventSendFailure, markEventSendSuccess, onCurrentEventFinished, recordEventSendResults, withEventContext, withProcessorTrace };