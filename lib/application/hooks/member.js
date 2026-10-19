import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { createActionCaller, resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/member.ts
/**
* 成员管理
* @param event 事件上下文
*/
const useMember = (event) => {
	const valueEvent = resolveActionContext(event);
	const call = createActionCaller(valueEvent);
	const getGuildId = (guildId) => guildId || valueEvent.GuildId;
	/**
	* 获取成员信息
	* @param params.userId 用户 ID
	* @param params.guildId 服务器 ID（不传则使用事件上下文）
	*/
	const info = async (params) => {
		try {
			const results = await sendAction({
				action: "member.info",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					params: {
						userId: params.userId,
						guildId: getGuildId(params.guildId)
					}
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.member.information"), result.data ?? null);
			return results[0] || createResult(ResultCode.Warn, translate("result.no.member.information.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.member.information"), null);
		}
	};
	/**
	* 获取成员列表
	* @param params.guildId 服务器 ID（不传则使用事件上下文）
	* @param params.pagination 分页参数
	*/
	const list = async (params) => {
		const guildId = getGuildId(params?.guildId);
		if (!guildId) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), { Items: [] });
		try {
			const results = await sendAction({
				action: "member.list",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					GuildId: guildId,
					params: params?.pagination
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.member.list"), result.data ?? { Items: [] });
			return results[0] || createResult(ResultCode.Warn, translate("result.no.member.list.found"), { Items: [] });
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.member.list"), { Items: [] });
		}
	};
	/**
	* 踢出成员
	*/
	const kick = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
		try {
			const results = await sendAction({
				action: "member.kick",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					GuildId: gid,
					UserId: params.userId
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.kick.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.kick.member"), null);
		}
	};
	/**
	* 封禁成员
	*/
	const ban = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
		try {
			const results = await sendAction({
				action: "member.ban",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					GuildId: gid,
					UserId: params.userId,
					params: {
						reason: params.reason,
						duration: params.duration
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.ban.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.ban.member"), null);
		}
	};
	/**
	* 解封成员
	*/
	const unban = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
		try {
			const results = await sendAction({
				action: "member.unban",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					GuildId: gid,
					UserId: params.userId
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.unban.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.unban.member"), null);
		}
	};
	/**
	* @deprecated 请使用 info
	*/
	const information = (params) => info(params);
	/**
	* 搜索成员
	* @param keyword 搜索关键字
	* @param guildId 服务器 ID（不传则使用事件上下文）
	* @param limit 返回数量限制
	*/
	const search = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.keyword) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.keyword"), null);
		try {
			const results = await sendAction({
				action: "member.search",
				payload: {
					event: valueEvent,
					BotId: valueEvent.BotId,
					target: resolveActionTarget(valueEvent),
					GuildId: gid,
					params: {
						keyword: params.keyword,
						limit: params.limit
					}
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.member.search.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.search.members"), null);
		}
	};
	return [{
		kickMany: (params) => call("member.kick.batch", params),
		blacklist: (params = {}) => call("member.blacklist.list", params),
		updateBlacklist: (params) => call("member.blacklist.update", params),
		muteMany: (params) => call("member.mute.batch", params),
		info,
		information,
		list,
		kick,
		ban,
		unban,
		search,
		/**
		* 禁言成员
		* @param userId 用户 ID
		* @param duration 禁言时长（秒），0 表示解除禁言
		* @param guildId 服务器 ID（不传则使用事件上下文）
		*/
		async mute(params) {
			const gid = getGuildId(params.guildId);
			if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
			try {
				const results = await sendAction({
					action: "member.mute",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						UserId: params.userId,
						params: { duration: params.duration }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.mute.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.mute.member"), null);
			}
		},
		/**
		* 设置/取消管理员
		* @param userId 用户 ID
		* @param enable 是否设为管理员
		* @param guildId 服务器 ID（不传则使用事件上下文）
		*/
		async admin(params) {
			const gid = getGuildId(params.guildId);
			if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
			try {
				const results = await sendAction({
					action: "member.admin",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						UserId: params.userId,
						params: { enable: params.enable }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.admin.set.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.set.admin"), null);
			}
		},
		/**
		* 设置成员名片/昵称
		* @param userId 用户 ID
		* @param card 名片内容，空字符串表示取消
		* @param guildId 服务器 ID（不传则使用事件上下文）
		*/
		async card(params) {
			const gid = getGuildId(params.guildId);
			if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
			try {
				const results = await sendAction({
					action: "member.card",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						UserId: params.userId,
						params: { card: params.card }
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.card.set.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.set.member.card"), null);
			}
		},
		/**
		* 设置成员专属头衔
		* @param userId 用户 ID
		* @param title 头衔内容
		* @param guildId 服务器 ID（不传则使用事件上下文）
		* @param duration 有效期（秒），-1 表示永久
		*/
		async title(params) {
			const gid = getGuildId(params.guildId);
			if (!gid || !params.userId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.userid"), null);
			try {
				const results = await sendAction({
					action: "member.title",
					payload: {
						event: valueEvent,
						BotId: valueEvent.BotId,
						target: resolveActionTarget(valueEvent),
						GuildId: gid,
						UserId: params.userId,
						params: {
							title: params.title,
							duration: params.duration ?? -1
						}
					}
				});
				return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.title.set.not.supported.or.failed"), null);
			} catch {
				return createResult(ResultCode.Fail, translate("result.failed.to.set.member.title"), null);
			}
		}
	}];
};

//#endregion
export { useMember };