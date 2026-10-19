import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/channel.ts
/**
* 频道管理
* @param event 事件上下文
*/
const useChannel = (event) => {
	const valueEvent = resolveActionContext(event);
	const target = (channelId) => resolveActionTarget(valueEvent) ?? (channelId ? {
		scope: "channel",
		targetId: channelId,
		BotId: valueEvent.BotId
	} : void 0);
	/**
	* 获取频道信息
	* @param channelId 频道 ID（不传则使用事件上下文）
	*/
	const info = async (params) => {
		const cid = params?.channelId || valueEvent.ChannelId;
		if (!cid) return createResult(ResultCode.FailParams, translate("result.missing.channelid"), null);
		try {
			const result = (await sendAction({
				action: "channel.info",
				payload: {
					event: valueEvent,
					ChannelId: cid,
					...target(cid) && { target: target(cid) }
				}
			})).find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.channel.info"), result.data ?? null);
			return createResult(ResultCode.Warn, translate("result.no.channel.info.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.channel.info"), null);
		}
	};
	/**
	* 获取频道列表
	* @param guildId 服务器 ID（不传则使用事件上下文）
	*/
	const list = async (params) => {
		const gid = params?.guildId || valueEvent.GuildId;
		if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), []);
		try {
			const result = (await sendAction({
				action: "channel.list",
				payload: {
					event: valueEvent,
					GuildId: gid
				}
			})).find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.channel.list"), result.data ?? []);
			return createResult(ResultCode.Warn, translate("result.no.channel.list.found"), []);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.channel.list"), []);
		}
	};
	/**
	* 创建频道
	*/
	const create = async (params) => {
		const gid = params.guildId || valueEvent.GuildId;
		if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
		try {
			const result = (await sendAction({
				action: "channel.create",
				payload: {
					event: valueEvent,
					GuildId: gid,
					params: {
						name: params.name,
						type: params.type,
						parentId: params.parentId
					}
				}
			})).find((item) => item.code === ResultCode.Ok);
			return result ? createResult(ResultCode.Ok, translate("result.channel.created"), result.data ?? null) : createResult(ResultCode.Warn, translate("result.create.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.create.channel"), null);
		}
	};
	/**
	* 更新频道
	*/
	const update = async (params) => {
		if (!params.channelId) return createResult(ResultCode.FailParams, translate("result.missing.channelid"), null);
		try {
			return (await sendAction({
				action: "channel.update",
				payload: {
					event: valueEvent,
					ChannelId: params.channelId,
					...target(params.channelId) && { target: target(params.channelId) },
					params: {
						name: params.name,
						topic: params.topic,
						position: params.position
					}
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.update.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.update.channel"), null);
		}
	};
	/**
	* 删除频道
	*/
	const remove = async (params) => {
		if (!params.channelId) return createResult(ResultCode.FailParams, translate("result.missing.channelid"), null);
		try {
			return (await sendAction({
				action: "channel.delete",
				payload: {
					event: valueEvent,
					ChannelId: params.channelId,
					...target(params.channelId) && { target: target(params.channelId) }
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.delete.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.delete.channel"), null);
		}
	};
	return [{
		info,
		list,
		create,
		update,
		delete: remove
	}];
};

//#endregion
export { useChannel };