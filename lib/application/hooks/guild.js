import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { createActionCaller, resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/guild.ts
/**
* 服务器/公会管理
* @param event 事件上下文
*/
const useGuild = (event) => {
	const valueEvent = resolveActionContext(event);
	const call = createActionCaller(valueEvent);
	/**
	* 获取服务器信息
	* @param guildId 服务器 ID（不传则使用事件上下文）
	*/
	const info = async (params) => {
		const gid = params?.guildId || valueEvent.GuildId;
		if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
		try {
			const results = await sendAction({
				action: "guild.info",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					GuildId: gid
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.guild.info"), result.data ?? null);
			return results[0] || createResult(ResultCode.Warn, translate("result.no.guild.info.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.guild.info"), null);
		}
	};
	/**
	* 获取 Bot 加入的服务器列表
	*/
	const list = async () => {
		try {
			const results = await sendAction({
				action: "guild.list",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent)
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.guild.list"), result.data ?? []);
			return results[0] || createResult(ResultCode.Warn, translate("result.no.guild.list.found"), []);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.guild.list"), []);
		}
	};
	return [{
		botInfo: (params = {}) => call("guild.bot.info", params),
		muteState: (params = {}) => call("guild.mute.get", params),
		info,
		list,
		/**
		* 更新服务器/群设置
		* @param params.name 新名称
		* @param guildId 服务器 ID（不传则使用事件上下文）
		*/
		async update(params) {
			const gid = params.guildId || valueEvent.GuildId;
			if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
			try {
				const results = await sendAction({
					action: "guild.update",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						params: { name: params.name }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.update.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.update.guild"), null);
			}
		},
		/**
		* 退出服务器/群
		* @param guildId 服务器 ID（不传则使用事件上下文）
		* @param isDismiss 是否解散（仅群主有效）
		*/
		async leave(params) {
			const gid = params?.guildId || valueEvent.GuildId;
			if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
			try {
				const results = await sendAction({
					action: "guild.leave",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						params: { isDismiss: params?.isDismiss }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.leave.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.leave.guild"), null);
			}
		},
		/**
		* 全员禁言/解除全员禁言
		* @param enable 是否开启全员禁言
		* @param guildId 服务器 ID（不传则使用事件上下文）
		*/
		async mute(params) {
			const gid = params.guildId || valueEvent.GuildId;
			if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
			try {
				const results = await sendAction({
					action: "guild.mute",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						params: { enable: params.enable }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.mute.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.mute.guild"), null);
			}
		}
	}];
};

//#endregion
export { useGuild };