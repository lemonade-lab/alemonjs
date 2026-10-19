import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/permission.ts
/**
* 频道权限管理
* @param event 事件上下文
*/
const usePermission = (event) => {
	const valueEvent = resolveActionContext(event);
	const target = (channelId) => resolveActionTarget(valueEvent) ?? (channelId ? {
		scope: "channel",
		targetId: channelId,
		BotId: valueEvent.BotId
	} : void 0);
	/**
	* 获取用户在频道中的权限
	* @param userId 用户 ID
	* @param channelId 频道 ID（不传则使用事件上下文）
	*/
	const get = async (params) => {
		const cid = params.channelId || valueEvent.ChannelId;
		if (!cid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.channelid.or.userid"), null);
		try {
			return (await sendAction({
				action: "permission.get",
				payload: {
					event: valueEvent,
					ChannelId: cid,
					UserId: params.userId,
					...target(cid) && { target: target(cid) }
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.permission.get.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.permission"), null);
		}
	};
	/**
	* 设置用户在频道中的权限
	* @param userId 用户 ID
	* @param params.allow 允许的权限位
	* @param params.deny 拒绝的权限位
	* @param channelId 频道 ID（不传则使用事件上下文）
	*/
	const set = async (params) => {
		const cid = params.channelId || valueEvent.ChannelId;
		if (!cid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.channelid.or.userid"), null);
		try {
			return (await sendAction({
				action: "permission.set",
				payload: {
					event: valueEvent,
					ChannelId: cid,
					UserId: params.userId,
					...target(cid) && { target: target(cid) },
					params: {
						allow: params.allow,
						deny: params.deny
					}
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.permission.set.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.set.permission"), null);
		}
	};
	const getRole = async (params) => {
		const cid = params.channelId || valueEvent.ChannelId;
		return action("permission.role.get", {
			event: valueEvent,
			ChannelId: cid,
			RoleId: params.roleId,
			...target(cid) && { target: target(cid) }
		});
	};
	const setRole = async (params) => {
		const cid = params.channelId || valueEvent.ChannelId;
		return action("permission.role.set", {
			event: valueEvent,
			ChannelId: cid,
			RoleId: params.roleId,
			...target(cid) && { target: target(cid) },
			params
		});
	};
	const action = async (name, payload) => {
		const results = await sendAction({
			action: name,
			payload
		});
		return results.find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Fail, results[0]?.message || translate("action.failed", { action: name }), null);
	};
	return [{
		get,
		set,
		getRole,
		setRole
	}];
};

//#endregion
export { usePermission };