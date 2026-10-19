import { ResultCode } from "../../common/variable.js";
import { createResult } from "../../common/result.js";
import "../../common/utils.js";
import { ChildrenApp } from "../runtime/store.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { sendAPI } from "../runtime/cbp/processor/api.js";
import { Format } from "../format/message-format.js";
import { getCurrentEvent, getCurrentNext, markEventSendAttempt, markEventSendFailure, recordEventSendResults } from "../runtime/hook-event-context.js";

//#region src/application/hooks/common.ts
const getEventOrThrow = (event) => {
	const currentEvent = event ?? getCurrentEvent();
	if (!currentEvent || typeof currentEvent !== "object") {
		logger.error({
			code: ResultCode.FailParams,
			message: "Invalid event: event must be an object",
			data: null
		});
		throw new Error("Invalid event: event must be an object");
	}
	return currentEvent;
};

//#endregion
export { ChildrenApp, Format, ResultCode, createResult, getCurrentEvent, getCurrentNext, getEventOrThrow, markEventSendAttempt, markEventSendFailure, recordEventSendResults, sendAPI, sendAction };