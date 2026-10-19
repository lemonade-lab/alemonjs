import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext } from "./action-context.js";

//#region src/application/hooks/announce.ts
/**
* 频道公告管理
* @param event 事件上下文
*/
const useAnnounce = (event) => {
	const valueEvent = resolveActionContext(event);
	/**
	* 设置公告
	* @param messageId 消息 ID
	* @param params.channelId 频道 ID（用于指定公告来源子频道）
	* @param guildId 服务器 ID（不传则使用事件上下文）
	*/
	const set = async (params) => {
		const gid = params.guildId || valueEvent.GuildId;
		if (!gid || !params.messageId) return createResult(ResultCode.FailParams, translate("result.missing.guildid.or.messageid"), null);
		try {
			return (await sendAction({
				action: "channel.announce",
				payload: {
					event: valueEvent,
					GuildId: gid,
					params: {
						messageId: params.messageId,
						channelId: params.channelId
					}
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.announce.set.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.set.announcement"), null);
		}
	};
	/**
	* 删除公告
	* @param messageId 消息 ID（传 'all' 删除所有公告）
	* @param guildId 服务器 ID（不传则使用事件上下文）
	*/
	const remove = async (params) => {
		const gid = params?.guildId || valueEvent.GuildId;
		if (!gid) return createResult(ResultCode.FailParams, translate("result.missing.guildid"), null);
		try {
			return (await sendAction({
				action: "channel.announce",
				payload: {
					event: valueEvent,
					GuildId: gid,
					params: {
						messageId: params?.messageId || "all",
						remove: true
					}
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.announce.remove.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.remove.announcement"), null);
		}
	};
	return [{
		set,
		remove
	}];
};

//#endregion
export { useAnnounce };