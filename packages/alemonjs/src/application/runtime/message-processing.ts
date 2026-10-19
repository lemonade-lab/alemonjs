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
let conversationOptions: ConversationOptions | undefined;
let conversation: ReturnType<typeof createConversationService> | undefined;
let limitOptions: RateLimitOptions | undefined;
let limiter: ReturnType<typeof createRateLimiter> | undefined;

/** Capture before response filters so observed non-triggering group messages
 * remain available. Called only after duplicate-message and deny-list checks. */
export const captureMessageContext = async (event: ConversationEvent, options: ProcessingOptions) => {
  if (options.conversation !== conversationOptions) {
    const next = options.conversation ? createConversationService(options.conversation) : undefined;

    conversationOptions = options.conversation;
    conversation = next;
  }
  if (conversation) {
    try {
      await conversation.capture(event);
    } catch {
      logger.warn('[conversation] Context storage unavailable; continuing without captured history');
    }
  }
};

export const checkMessageRateLimit = (event: ConversationEvent, options: ProcessingOptions) => {
  if (options.rateLimit !== limitOptions) {
    const next = options.rateLimit ? createRateLimiter(options.rateLimit) : undefined;

    limitOptions = options.rateLimit;
    limiter = next;
  }

  return limiter?.check(event) ?? { allowed: true as const };
};

export const startMessageTyping = (event: Events[EventKeys], options: ProcessingOptions) => {
  if (!options.autoTyping || event.Platform !== 'qq-bot' || (event as ConversationEvent).Target?.scope !== 'c2c') {
    return;
  }
  const [message] = useMessage(event);
  const stop = startTypingIndicator(duration => message.typing({ duration }), options.autoTyping);

  onCurrentEventFinished(stop);
};
