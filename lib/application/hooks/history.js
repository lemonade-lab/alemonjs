import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { getEventOrThrow } from "./common.js";

//#region src/application/hooks/history.ts
/**
* 消息历史记录
* @param event 事件上下文
*/
const useHistory = (event) => {
	const valueEvent = getEventOrThrow(event);
	/**
	* 获取频道消息历史
	* @param channelId 频道 ID（不传则使用事件上下文）
	* @param params.limit 返回数量
	* @param params.before 在此消息之前
	* @param params.after 在此消息之后
	*/
	const list = async (params) => {
		const cid = params?.channelId || valueEvent.ChannelId;
		if (!cid) return createResult(ResultCode.FailParams, translate("result.missing.channelid"), null);
		try {
			return (await sendAction({
				action: "history.list",
				payload: {
					ChannelId: cid,
					params: {
						limit: params?.limit,
						before: params?.before,
						after: params?.after
					}
				}
			})).find((item) => item.code === ResultCode.Ok) || createResult(ResultCode.Warn, translate("result.history.list.not.supported.or.failed"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.message.history"), null);
		}
	};
	return [{ list }];
};

//#endregion
export { useHistory };