import { runtimeNow, scopedResource } from "../../common/runtime-scope.js";
import { onCurrentEventFinished } from "./hook-event-context.js";
import { startTypingIndicator } from "../typing.js";
import { useMessage } from "../hooks/message.js";
import { createConversationService } from "../conversation.js";
import { createRateLimiter } from "../rate-limit.js";

//#region src/application/runtime/message-processing.ts
const processingKey = Symbol("message-processing");
const createProcessing = () => ({
	conversationOptions: void 0,
	conversation: void 0,
	limitOptions: void 0,
	limiter: void 0
});
const defaultProcessing = createProcessing();
const processing = () => scopedResource(processingKey, createProcessing, defaultProcessing);
/** Capture before response filters so observed non-triggering group messages
* remain available. Called only after duplicate-message and deny-list checks. */
const captureMessageContext = async (event, options) => {
	const state = processing();
	if (options.conversation !== state.conversationOptions) {
		const next = options.conversation ? createConversationService(options.conversation, runtimeNow) : void 0;
		state.conversationOptions = options.conversation;
		state.conversation = next;
	}
	if (state.conversation) try {
		await state.conversation.capture(event);
	} catch {
		logger.warn("[conversation] Context storage unavailable; continuing without captured history");
	}
};
const checkMessageRateLimit = (event, options) => {
	const state = processing();
	if (options.rateLimit !== state.limitOptions) {
		const next = options.rateLimit ? createRateLimiter(options.rateLimit, runtimeNow) : void 0;
		state.limitOptions = options.rateLimit;
		state.limiter = next;
	}
	return state.limiter?.check(event) ?? { allowed: true };
};
const startMessageTyping = (event, options) => {
	if (!options.autoTyping || event.Platform !== "qq-bot" || event.Target?.scope !== "c2c") return;
	const [message] = useMessage(event);
	const stop = startTypingIndicator((duration) => message.typing({ duration }), options.autoTyping);
	onCurrentEventFinished(stop);
};

//#endregion
export { captureMessageContext, checkMessageRateLimit, startMessageTyping };