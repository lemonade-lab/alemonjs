import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { getEventOrThrow } from "./common.js";
import { createActionCaller, resolveActionContext } from "./action-context.js";

//#region src/application/hooks/me.ts
/**
* 获取我相关的数据
* @param event 事件上下文；不传时使用当前事件上下文
*/
const useMe = (event) => {
	const context = resolveActionContext(event);
	const call = createActionCaller(context);
	/**
	* 个人信息
	* @returns
	*/
	const info = async () => {
		try {
			const results = await sendAction({
				action: "me.info",
				payload: {
					event: context,
					BotId: context.BotId
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) {
				const data = result?.data ?? null;
				return createResult(ResultCode.Ok, translate("result.successfully.retrieved.bot.information"), data);
			}
			return results[0] || createResult(ResultCode.Warn, translate("result.no.bot.information.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.bot.information"), null);
		}
	};
	/**
	* 当前消息是否 @ 了机器人。
	*
	* 平台适配器会在标准化事件时填充 `IsAtMe`；未提供该能力的平台或非消息事件返回 `false`。
	*/
	const isAtMe = (targetEvent) => {
		return Boolean(getEventOrThrow(targetEvent ?? event).IsAtMe);
	};
	/**
	* @deprecated 请使用 isAtMe。该方法保留原有 Result 返回结构。
	*/
	const isMentionMe = (targetEvent) => {
		return createResult(ResultCode.Ok, translate("result.successfully.checked.whether.the.bot.was.mentioned"), isAtMe(targetEvent));
	};
	/**
	* 加入的服务器列表
	*/
	const guilds = async () => {
		try {
			const results = await sendAction({
				action: "me.guilds",
				payload: {
					event: context,
					BotId: context.BotId
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.guild.list"), result.data ?? []);
			return results[0] || createResult(ResultCode.Warn, translate("result.no.guild.list.found"), []);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.guild.list"), []);
		}
	};
	/**
	* 私聊线程列表
	*/
	const threads = async () => {
		try {
			const results = await sendAction({
				action: "me.threads",
				payload: {
					event: context,
					BotId: context.BotId
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) {
				const data = result?.data ?? null;
				return createResult(ResultCode.Ok, translate("result.successfully.retrieved.bot.information"), data);
			}
			return results[0] || createResult(ResultCode.Warn, translate("result.no.bot.information.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.bot.information"), null);
		}
	};
	/**
	* 好友列表
	*/
	const friends = async () => {
		try {
			const results = await sendAction({
				action: "me.friends",
				payload: {
					event: context,
					BotId: context.BotId
				}
			});
			const result = results.find((item) => item.code === ResultCode.Ok);
			if (result) {
				const data = result?.data ?? null;
				return createResult(ResultCode.Ok, translate("result.successfully.retrieved.bot.information"), data);
			}
			return results[0] || createResult(ResultCode.Warn, translate("result.no.bot.information.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.bot.information"), null);
		}
	};
	return [{
		share: (params = {}) => call("me.share", params),
		info,
		isAtMe,
		isMentionMe,
		guilds,
		threads,
		friends
	}];
};

//#endregion
export { useMe };