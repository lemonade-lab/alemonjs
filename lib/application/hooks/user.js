import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";

//#region src/application/hooks/user.ts
/**
* 用户信息查询（无需群/服务器上下文）
*/
const useUser = () => {
	/**
	* 获取用户信息
	* @param userId 用户 ID
	*/
	const info = async (params) => {
		if (!params.userId) return createResult(ResultCode.FailParams, translate("result.missing.userid"), null);
		try {
			const result = (await sendAction({
				action: "user.info",
				payload: { UserId: params.userId }
			})).find((item) => item.code === ResultCode.Ok);
			if (result) return createResult(ResultCode.Ok, translate("result.successfully.retrieved.user.info"), result.data ?? null);
			return createResult(ResultCode.Warn, translate("result.no.user.info.found"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.user.info"), null);
		}
	};
	return [{ info }];
};

//#endregion
export { useUser };