import { logger } from "../../common/logger.js";
import { ResultCode } from "../../common/variable.js";
import { sendAPI } from "../runtime/cbp/processor/api.js";
import { getCurrentEvent } from "../runtime/hook-event-context.js";

//#region src/application/hooks/client.ts
const createDeepProxy = (event, path = []) => {
	return new Proxy((() => {}), {
		get(_target, prop) {
			if (typeof prop === "symbol") return;
			return createDeepProxy(event, [...path, String(prop)]);
		},
		apply(_target, _thisArg, args) {
			return sendAPI({
				action: "client.api",
				payload: {
					event,
					key: path.join("."),
					params: args
				}
			});
		}
	});
};
function useClient(eventOrClass, _ApiClass) {
	let valueEvent;
	if (eventOrClass !== void 0 && typeof eventOrClass === "function") valueEvent = getCurrentEvent();
	else valueEvent = eventOrClass ?? getCurrentEvent();
	if (!valueEvent || typeof valueEvent !== "object") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Invalid event: event must be an object",
			data: null
		});
		throw new Error("Invalid event: event must be an object");
	}
	return [createDeepProxy(valueEvent)];
}

//#endregion
export { useClient };