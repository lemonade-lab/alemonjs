import { logger } from "../../common/logger.js";
import { runtimeScope, trackRuntimeTask } from "../../common/runtime-scope.js";
import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { Format } from "../format/message-format.js";
import { getCurrentEvent, markEventSendAttempt, markEventSendFailure, recordEventSendResults } from "../runtime/hook-event-context.js";
import "./common.js";
import { createActionCaller, resolveActionContext, resolveActionTarget } from "./action-context.js";
import { runWithTyping } from "../typing.js";

//#region src/application/hooks/message.ts
/**
* 消息处理
* @param event
* @returns
*/
const useMessage = (event) => {
	const valueEvent = resolveActionContext(event);
	const call = createActionCaller(valueEvent);
	const traceEvent = event ?? getCurrentEvent() ?? valueEvent;
	/**
	* 将 format 参数解析为 DataEnums[]
	*/
	const resolveFormat = (params) => {
		if (params.format instanceof Format) return params.format.value;
		return params.format;
	};
	/**
	* 发送消息（内部方法，兼容旧API）
	* @param val
	* @returns
	*/
	const sendRaw = async (val, replyId, options) => {
		if (!val || val.length === 0) return [createResult(ResultCode.FailParams, translate("result.invalid.val.val.must.be.a.non.empty.array"), null)];
		markEventSendAttempt(traceEvent);
		try {
			const result = await sendAction({
				action: "message.send",
				payload: {
					event: valueEvent,
					BotId: options?.target?.BotId ?? valueEvent.BotId,
					target: options?.target ?? resolveActionTarget(valueEvent),
					params: {
						...options,
						format: val,
						replyId
					}
				}
			});
			const results = Array.isArray(result) ? result : [result];
			recordEventSendResults(results, traceEvent);
			if (results.length === 0 || results.every((item) => item?.code !== ResultCode.Ok)) {
				const tag = valueEvent?._tag ?? "unknown";
				const codes = results.length > 0 ? results.map((item) => item?.code).join(", ") : "empty";
				const message = results[0]?.message ?? "";
				logger.warn(`[send] 消息发送未成功 (tag: ${tag}, code: ${codes}) ${message}`);
			}
			return results;
		} catch (error) {
			markEventSendFailure(error, traceEvent);
			throw error;
		}
	};
	const lightweight = {
		/** Keep input notifications alive for an explicitly awaited business task. */
		withTyping: (task, options) => runWithTyping((duration) => call("message.typing", { duration }), task, options),
		typing: (params = {}) => call("message.typing", params),
		stream: (params) => call("message.stream", params),
		/**
		* 发送消息
		* @param params 消息参数或 DataEnums 数组
		*/
		send(params) {
			if (Array.isArray(params)) return sendRaw(params.length > 0 ? params : []);
			if (params?.content) {
				markEventSendAttempt(traceEvent);
				return sendAction({
					action: "message.send",
					payload: {
						event: valueEvent,
						BotId: params.target?.BotId ?? valueEvent.BotId,
						target: params.target ?? resolveActionTarget(valueEvent),
						params
					}
				}).then((results) => {
					recordEventSendResults(results, traceEvent);
					return results;
				}).catch((error) => {
					markEventSendFailure(error, traceEvent);
					throw error;
				});
			}
			return sendRaw(params ? resolveFormat(params) : [], params?.replyId, params);
		},
		/**
		* 删除消息
		* @param params.messageId 消息 ID，不传则删除触发消息
		*/
		async delete(params) {
			const targetId = params?.messageId || valueEvent.MessageId;
			if (!targetId) return createResult(ResultCode.FailParams, translate("result.missing.messageid"), null);
			try {
				const results = await sendAction({
					action: "message.delete",
					payload: {
						MessageId: targetId,
						ChannelId: valueEvent.ChannelId,
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent)
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.delete.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.delete.message"), null);
			}
		},
		/**
		* 编辑消息
		* @param params 编辑参数
		*/
		async edit(params) {
			const targetId = params.messageId || valueEvent.MessageId;
			const channelId = valueEvent.ChannelId;
			if (!targetId || !channelId) return createResult(ResultCode.FailParams, translate("result.missing.messageid.or.channelid"), null);
			try {
				const val = params.format instanceof Format ? params.format.value : params.format;
				const results = await sendAction({
					action: "message.edit",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						ChannelId: channelId,
						MessageId: targetId,
						params: { format: val }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.edit.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.edit.message"), null);
			}
		},
		/**
		* 置顶消息
		* @param params.messageId 消息 ID，不传则置顶触发消息
		*/
		async pin(params) {
			const targetId = params?.messageId || valueEvent.MessageId;
			const channelId = valueEvent.ChannelId;
			if (!targetId || !channelId) return createResult(ResultCode.FailParams, translate("result.missing.messageid.or.channelid"), null);
			try {
				const results = await sendAction({
					action: "message.pin",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						ChannelId: channelId,
						MessageId: targetId
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.pin.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.pin.message"), null);
			}
		},
		/**
		* 取消置顶消息
		* @param params.messageId 消息 ID，不传则取消置顶触发消息
		*/
		async unpin(params) {
			const targetId = params?.messageId || valueEvent.MessageId;
			const channelId = valueEvent.ChannelId;
			if (!targetId || !channelId) return createResult(ResultCode.FailParams, translate("result.missing.messageid.or.channelid"), null);
			try {
				const results = await sendAction({
					action: "message.unpin",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						ChannelId: channelId,
						MessageId: targetId
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.unpin.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.unpin.message"), null);
			}
		},
		/**
		* 获取消息详情
		* @param params.messageId 消息 ID
		*/
		async get(params) {
			const targetId = params?.messageId || valueEvent.MessageId;
			if (!targetId) return createResult(ResultCode.FailParams, translate("result.missing.messageid"), null);
			try {
				const results = await sendAction({
					action: "message.get",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						MessageId: targetId
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.get.message.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.get.message"), null);
			}
		}
	};
	if (runtimeScope.getStore()) for (const key of Object.keys(lightweight)) {
		const original = lightweight[key];
		lightweight[key] = (...args) => trackRuntimeTask(original(...args), false);
	}
	return [lightweight];
};
/**
* 废弃，请使用 useMessage
* @deprecated
* @param event
* @returns
*/
const useSend = (event) => {
	const [message] = useMessage(event);
	const send = (...val) => {
		return message.send(val);
	};
	return send;
};
/**
* 废弃，请使用 useMessage
* @deprecated
* @param event
* @returns
*/
const useSends = (event) => {
	const [message] = useMessage(event);
	return [message.send];
};

//#endregion
export { useMessage, useSend, useSends };