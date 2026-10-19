import { EventKeys, Events } from "../../types/event/map.js";
import { ConversationEvent, ConversationOptions } from "../conversation.js";
import { RateLimitDecision, RateLimitOptions } from "../rate-limit.js";
import { TypingOptions } from "../typing.js";
import "../../types/index.js";
//#region src/application/runtime/message-processing.d.ts
type ProcessingOptions = {
  conversation?: ConversationOptions;
  rateLimit?: RateLimitOptions;
  autoTyping?: Omit<TypingOptions, 'signal' | 'onError'>;
};
/** Capture before response filters so observed non-triggering group messages
 * remain available. Called only after duplicate-message and deny-list checks. */
declare const captureMessageContext: (event: ConversationEvent, options: ProcessingOptions) => Promise<void>;
declare const checkMessageRateLimit: (event: ConversationEvent, options: ProcessingOptions) => RateLimitDecision;
declare const startMessageTyping: (event: Events[EventKeys], options: ProcessingOptions) => void;
//#endregion
export { captureMessageContext, checkMessageRateLimit, startMessageTyping };