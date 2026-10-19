import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { getEventOrThrow } from "./common.js";

//#region src/application/hooks/mention.ts
/**
* 使用提及。
* @param {Object} event - 事件对象，包含触发提及的相关信息。
* @throws {Error} - 如果 event 无效，抛出错误。
*/
const useMention = (event) => {
	const valueEvent = getEventOrThrow(event);
	let res = null;
	/** 加载数据（带缓存） */
	const load = async () => {
		if (res) return;
		if ("MessageMentions" in valueEvent && valueEvent.MessageMentions !== void 0) {
			res = valueEvent.MessageMentions;
			return;
		}
		const result = (await sendAction({
			action: "mention.get",
			payload: { event: valueEvent }
		})).find((item) => item.code === ResultCode.Ok);
		if (result) res = result.data;
	};
	/** 按条件过滤，默认排除 bot */
	const match = (item, options) => {
		if (options.UserId !== void 0 && item.UserId !== options.UserId) return false;
		if (options.UserKey !== void 0 && item.UserKey !== options.UserKey) return false;
		if (options.UserName !== void 0 && item.UserName !== options.UserName) return false;
		if (options.IsMaster !== void 0 && item.IsMaster !== options.IsMaster) return false;
		if (options.IsBot !== void 0 && item.IsBot !== options.IsBot) return false;
		if (options.IsBot === void 0 && item.IsBot) return false;
		return true;
	};
	const mention = {
		find: async (options = {}) => {
			try {
				await load();
			} catch (err) {
				return {
					...createResult(ResultCode.Fail, err?.message || "Failed to get mention data", null),
					count: 0
				};
			}
			if (!Array.isArray(res)) return {
				...createResult(ResultCode.Warn, "No mention data found", null),
				count: 0
			};
			const data = res.filter((item) => match(item, options));
			return {
				...createResult(ResultCode.Ok, translate("result.successfully.retrieved.mention.data"), data),
				count: data.length || 0
			};
		},
		findOne: async (options = {}) => {
			const results = await mention.find(options);
			if (results.code !== ResultCode.Ok || !results.data?.length) return {
				...createResult(results.code, results.message, null),
				count: 0
			};
			const data = results?.data[0];
			return {
				...createResult(ResultCode.Ok, results.message, data),
				count: results.data?.length || 0
			};
		}
	};
	return [mention];
};

//#endregion
export { useMention };