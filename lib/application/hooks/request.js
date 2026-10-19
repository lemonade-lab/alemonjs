import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { createActionCaller, resolveActionContext } from "./action-context.js";

//#region src/application/hooks/request.ts
/**
* 请求处理（好友请求、入群请求等）
*/
const useRequest = (context) => {
	const event = resolveActionContext(context);
	const call = createActionCaller(event);
	/**
	* 处理好友请求
	* @param flag 请求标识
	* @param approve 是否同意
	* @param remark 备注（同意时有效）
	*/
	const friend = async (params) => {
		if (!params.flag) return createResult(ResultCode.FailParams, translate("result.missing.flag"), null);
		try {
			const results = await sendAction({
				action: "request.friend",
				payload: {
					event,
					BotId: event.BotId,
					params: {
						flag: params.flag,
						approve: params.approve,
						remark: params.remark
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.friend.request.handling.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.handle.friend.request"), null);
		}
	};
	/**
	* 处理加群/加服务器请求
	* @param flag 请求标识
	* @param subType 请求子类型（如 add / invite）
	* @param approve 是否同意
	* @param reason 拒绝理由（拒绝时有效）
	*/
	const guild = async (params) => {
		if (!params.flag || !params.subType) return createResult(ResultCode.FailParams, translate("result.missing.flag.or.subtype"), null);
		try {
			const results = await sendAction({
				action: "request.guild",
				payload: {
					event,
					BotId: event.BotId,
					params: {
						flag: params.flag,
						subType: params.subType,
						approve: params.approve,
						reason: params.reason
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.guild.request.handling.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.handle.guild.request"), null);
		}
	};
	return [{
		list: (params = {}) => call("request.guild.list", params),
		decide: (params) => call("request.guild.decide", params),
		policies: {
			list: (params = {}) => call("request.policy.list", params),
			create: (params) => call("request.policy.create", params),
			update: (params) => call("request.policy.update", params),
			delete: (id) => call("request.policy.delete", { id }),
			execute: (id) => call("request.policy.execute", { id }),
			updateWhitelist: (params) => call("request.policy.whitelist", params)
		},
		friend,
		guild
	}];
};

//#endregion
export { useRequest };