import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/reaction.ts
/**
* 表情回应管理
* @param event 事件上下文
*/
const useReaction = (event) => {
	const valueEvent = resolveActionContext(event);
	const target = (channelId) => resolveActionTarget(valueEvent) ?? (channelId ? {
		scope: "channel",
		targetId: channelId,
		BotId: valueEvent.BotId
	} : void 0);
	/**
	* 添加表情回应
	* @param emojiId 表情 ID 或 Unicode
	* @param messageId 消息 ID（不传则使用触发消息）
	*/
	const add = async (params) => {
		const mid = params.messageId || valueEvent.MessageId;
		const cid = params.channelId || valueEvent.ChannelId;
		if (!mid || !cid || !params.emojiId) return createResult(ResultCode.FailParams, translate("result.missing.channelid.messageid.or.emojiid"), null);
		try {
			return (await sendAction({
				action: "reaction.add",
				payload: {
					event: valueEvent,
					ChannelId: cid,
					MessageId: mid,
					EmojiId: params.emojiId,
					...target(cid) && { target: target(cid) }
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.reaction.add.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.add.reaction"), null);
		}
	};
	/**
	* 移除表情回应
	* @param emojiId 表情 ID 或 Unicode
	* @param messageId 消息 ID（不传则使用触发消息）
	*/
	const remove = async (params) => {
		const mid = params.messageId || valueEvent.MessageId;
		const cid = params.channelId || valueEvent.ChannelId;
		if (!mid || !cid || !params.emojiId) return createResult(ResultCode.FailParams, translate("result.missing.channelid.messageid.or.emojiid"), null);
		try {
			return (await sendAction({
				action: "reaction.remove",
				payload: {
					event: valueEvent,
					ChannelId: cid,
					MessageId: mid,
					EmojiId: params.emojiId,
					...target(cid) && { target: target(cid) }
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.reaction.remove.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.remove.reaction"), null);
		}
	};
	/**
	* 获取某个表情的回应用户列表
	* @param emojiId 表情 ID 或 Unicode
	* @param messageId 消息 ID（不传则使用触发消息）
	* @param limit 返回数量限制
	*/
	const list = async (params) => {
		const mid = params.messageId || valueEvent.MessageId;
		const cid = params.channelId || valueEvent.ChannelId;
		if (!mid || !cid || !params.emojiId) return createResult(ResultCode.FailParams, translate("result.missing.channelid.messageid.or.emojiid"), null);
		try {
			return (await sendAction({
				action: "reaction.list",
				payload: {
					event: valueEvent,
					ChannelId: cid,
					MessageId: mid,
					EmojiId: params.emojiId,
					...target(cid) && { target: target(cid) },
					params: { limit: params.limit }
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.reaction.list.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.list.reactions"), null);
		}
	};
	return [{
		add,
		remove,
		list
	}];
};

//#endregion
export { useReaction };