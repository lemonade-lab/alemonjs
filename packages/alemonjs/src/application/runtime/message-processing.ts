import { scopedResource, runtimeNow } from '../../common/runtime-scope.js';
import type { ConversationOptions, ConversationEvent } from '../conversation.js';
import { createConversationService } from '../conversation.js';
import type { RateLimitOptions } from '../rate-limit.js';
import { createRateLimiter } from '../rate-limit.js';
import type { TypingOptions } from '../typing.js';
import { startTypingIndicator } from '../typing.js';
import { useMessage } from '../hooks/message.js';
import { onCurrentEventFinished } from './hook-event-context.js';
import type { EventKeys, Events } from '../../types/index.js';

type ProcessingOptions = {
  conversation?: ConversationOptions;
  rateLimit?: RateLimitOptions;
  autoTyping?: Omit<TypingOptions, 'signal' | 'onError'>;
};
const processingKey = Symbol('message-processing');
const createProcessing = () => ({
  conversationOptions: undefined as ConversationOptions | undefined,
  conversation: undefined as ReturnType<typeof createConversationService> | undefined,
  limitOptions: undefined as RateLimitOptions | undefined,
  limiter: undefined as ReturnType<typeof createRateLimiter> | undefined
});
const defaultProcessing = createProcessing();
const processing = () => scopedResource(processingKey, createProcessing, defaultProcessing);

/** Capture before response filters so observed non-triggering group messages
 * remain available. Called only after duplicate-message and deny-list checks. */
export const captureMessageContext = async (event: ConversationEvent, options: ProcessingOptions) => {
  const state = processing();

  if (options.conversation !== state.conversationOptions) {
    const next = options.conversation ? createConversationService(options.conversation, runtimeNow) : undefined;

    state.conversationOptions = options.conversation;
    state.conversation = next;
  }
  if (state.conversation) {
    try {
      await state.conversation.capture(event);
    } catch {
      logger.warn('[conversation] Context storage unavailable; continuing without captured history');
    }
  }
};

export const checkMessageRateLimit = (event: ConversationEvent, options: ProcessingOptions) => {
  const state = processing();

  if (options.rateLimit !== state.limitOptions) {
    const next = options.rateLimit ? createRateLimiter(options.rateLimit, runtimeNow) : undefined;

    state.limitOptions = options.rateLimit;
    state.limiter = next;
  }

  return state.limiter?.check(event) ?? { allowed: true as const };
};

export const startMessageTyping = (event: Events[EventKeys], options: ProcessingOptions) => {
  if (!options.autoTyping || event.Platform !== 'qq-bot' || (event as ConversationEvent).Target?.scope !== 'c2c') {
    return;
  }
  const [message] = useMessage(event);
  const stop = startTypingIndicator(duration => message.typing({ duration }), options.autoTyping);

  onCurrentEventFinished(stop);
};
