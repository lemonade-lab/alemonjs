import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { createActionCaller, resolveActionContext } from "./action-context.js";

//#region src/application/hooks/connection.ts
/** Read the current transport state without coupling applications to a platform SDK. */
const useConnection = (context) => {
	const event = resolveActionContext(context);
	const call = createActionCaller(event);
	const getStatus = async (params) => {
		try {
			const results = await sendAction({
				action: "connection.status",
				payload: { BotId: params?.BotId ?? event.BotId }
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.connection.status.is.not.supported"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.get.connection.status"), null);
		}
	};
	return [{
		getStatus,
		gateway: () => call("connection.gateway", {})
	}];
};

//#endregion
export { useConnection };