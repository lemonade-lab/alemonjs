import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import "./common.js";
import { resolveActionContext, resolveActionTarget } from "./action-context.js";

//#region src/application/hooks/interaction.ts
/** Acknowledge a platform interaction using the identifier supplied by the event. */
const useInteraction = (event) => {
	const valueEvent = resolveActionContext(event);
	const ack = async (params) => {
		const interactionId = params?.InteractionId || valueEvent.InteractionId;
		const eventTarget = resolveActionTarget(valueEvent);
		const target = params?.target || eventTarget;
		if (!interactionId) return createResult(ResultCode.FailParams, translate("result.missing.interactionid"), null);
		try {
			const results = await sendAction({
				action: "interaction.ack",
				payload: {
					InteractionId: interactionId,
					event: valueEvent,
					BotId: target?.BotId ?? valueEvent.BotId,
					...target && { target },
					params: { code: params?.code }
				}
			});
			return results.find((item) => item.code === ResultCode.Ok) || results[0] || createResult(ResultCode.Warn, translate("result.interaction.acknowledgement.is.not.supported"), null);
		} catch {
			return createResult(ResultCode.Fail, translate("result.failed.to.acknowledge.interaction"), null);
		}
	};
	return [{ ack }];
};

//#endregion
export { useInteraction };