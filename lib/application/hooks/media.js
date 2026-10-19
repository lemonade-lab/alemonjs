import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { createActionCaller, resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/media.ts
/**
* 媒体管理（图片/音频/视频/文件）
* @param event 事件上下文
*/
const useMedia = (event) => {
	const valueEvent = resolveActionContext(event);
	const call = createActionCaller(valueEvent);
	const validateSource = (params) => {
		const sources = [
			params.url,
			params.data,
			params.filePath,
			params.fileId
		].filter((value) => value !== void 0);
		return sources.length === 1 && sources.every((value) => typeof value === "string" && value.length > 0);
	};
	/**
	* 上传媒体文件（默认不发送，send=true 使用平台主动发送）
	* @param params.type 媒体类型
	* @param params.url 文件 URL
	* @param params.data base64 数据
	* @param params.name 文件名
	*/
	const upload = async (params) => {
		if ([
			"replyId",
			"eventId",
			"referenceId",
			"sequence",
			"wakeup",
			"content"
		].some((key) => key in params)) return createResult(ResultCode.FailParams, translate("result.use.media.send.for.message.delivery.options"), null);
		if (!validateSource(params)) return createResult(ResultCode.FailParams, translate("result.provide.exactly.one.media.source"), null);
		try {
			const results = await sendAction({
				action: "media.upload",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: params.target ?? resolveActionTarget(valueEvent),
					params
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.media.upload.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.upload.media"), null);
		}
	};
	/**
	* 发送媒体到频道
	* @param channelId 频道 ID（不传则使用事件上下文）
	*/
	const sendChannel = async (params) => {
		const cid = params.channelId || params.target?.targetId || valueEvent.ChannelId;
		const contextTarget = params.target ?? resolveActionTarget(valueEvent);
		const target = contextTarget && {
			...contextTarget,
			targetId: cid,
			BotId: params.BotId ?? contextTarget.BotId ?? valueEvent.BotId
		};
		if (!validateSource(params) || params.target && (params.target.targetId !== cid || !["group", "channel"].includes(params.target.scope))) return createResult(ResultCode.FailParams, translate("result.invalid.media.source.or.conflicting.channel.target"), null);
		if (!cid) return createResult(ResultCode.FailParams, translate("result.missing.channelid"), null);
		try {
			const results = await sendAction({
				action: "media.send.channel",
				payload: {
					event: valueEvent,
					BotId: params.BotId ?? valueEvent.BotId,
					target,
					ChannelId: cid,
					params: {
						...params,
						target
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.media.send.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.send.media.to.channel"), null);
		}
	};
	/**
	* 发送媒体到用户
	* @param userId 用户 ID
	*/
	const sendUser = async (params) => {
		if (!validateSource(params) || params.target && (params.target.targetId !== params.userId || !["c2c", "direct"].includes(params.target.scope))) return createResult(ResultCode.FailParams, translate("result.invalid.media.source.or.conflicting.user.target"), null);
		const target = {
			scope: params.target?.scope ?? "c2c",
			targetId: params.userId,
			BotId: params.BotId ?? params.target?.BotId ?? valueEvent.BotId
		};
		if (!params.userId) return createResult(ResultCode.FailParams, translate("result.missing.userid"), null);
		try {
			const results = await sendAction({
				action: "media.send.user",
				payload: {
					event: valueEvent,
					BotId: params.BotId ?? valueEvent.BotId,
					target,
					UserId: params.userId,
					params: {
						...params,
						target
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.media.send.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.send.media.to.user"), null);
		}
	};
	/** Preferred scoped media API for group/C2C platforms. */
	const send = async (params) => {
		const target = params.target ?? resolveActionTarget(valueEvent);
		if (!target?.targetId) return createResult(ResultCode.FailParams, translate("result.missing.targetid"), null);
		if (!validateSource(params)) return createResult(ResultCode.FailParams, translate("result.provide.exactly.one.media.source"), null);
		try {
			const results = await sendAction({
				action: "media.send",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: {
						...target,
						BotId: target.BotId ?? valueEvent.BotId
					},
					params: {
						...params,
						target
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.media.send.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.send.media"), null);
		}
	};
	return [{
		prepare: (params) => call("media.prepare", params),
		finishPart: (params) => call("media.part.finish", params),
		complete: (params) => call("media.complete", params),
		upload,
		sendChannel,
		sendUser,
		send
	}];
};

//#endregion
export { useMedia };