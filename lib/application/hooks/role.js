import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext } from "./action-context.js";

//#region src/application/hooks/role.ts
/**
* 角色管理
* @param event 事件上下文
*/
const useRole = (event) => {
	const valueEvent = resolveActionContext(event);
	const getGuildId = (guildId) => guildId || valueEvent.GuildId;
	/**
	* 获取角色列表
	*/
	const list = async (params) => {
		const gid = getGuildId(params?.guildId);
		if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), []);
		try {
			const result = (await sendAction({
				action: "role.list",
				payload: {
					event: valueEvent,
					GuildId: gid
				}
			})).find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.role.list"), result.data ?? []);
			return createResult(ResultCode.Warn, translate("result.no.role.list.found"), []);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.role.list"), []);
		}
	};
	/**
	* 创建角色
	*/
	const create = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
		try {
			const result = (await sendAction({
				action: "role.create",
				payload: {
					event: valueEvent,
					GuildId: gid,
					params: {
						name: params.name,
						color: params.color,
						permissions: params.permissions
					}
				}
			})).find((item) => item.code === ResultCode.Ok);
			return result ? createResult(ResultCode.Ok, translate("result.role.created"), result.data ?? null) : createResult(ResultCode.Warn, translate("result.create.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.create.role"), null);
		}
	};
	/**
	* 更新角色
	*/
	const update = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.roleId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.roleid"), null);
		try {
			return (await sendAction({
				action: "role.update",
				payload: {
					event: valueEvent,
					GuildId: gid,
					RoleId: params.roleId,
					params: {
						name: params.name,
						color: params.color,
						permissions: params.permissions
					}
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.update.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.update.role"), null);
		}
	};
	/**
	* 删除角色
	*/
	const remove = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.roleId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.roleid"), null);
		try {
			return (await sendAction({
				action: "role.delete",
				payload: {
					event: valueEvent,
					GuildId: gid,
					RoleId: params.roleId
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.delete.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.delete.role"), null);
		}
	};
	/**
	* 为成员分配角色
	*/
	const assign = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.userId || !params.roleId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.userid.or.roleid"), null);
		try {
			return (await sendAction({
				action: "role.assign",
				payload: {
					event: valueEvent,
					GuildId: gid,
					ChannelId: params.channelId ?? valueEvent.ChannelId,
					UserId: params.userId,
					RoleId: params.roleId
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.assign.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.assign.role"), null);
		}
	};
	/**
	* 移除成员角色
	*/
	const revoke = async (params) => {
		const gid = getGuildId(params.guildId);
		if (!gid || !params.userId || !params.roleId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.userid.or.roleid"), null);
		try {
			return (await sendAction({
				action: "role.remove",
				payload: {
					event: valueEvent,
					GuildId: gid,
					ChannelId: params.channelId ?? valueEvent.ChannelId,
					UserId: params.userId,
					RoleId: params.roleId
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.remove.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.remove.role"), null);
		}
	};
	return [{
		list,
		create,
		update,
		delete: remove,
		assign,
		remove: revoke
	}];
};

//#endregion
export { useRole };