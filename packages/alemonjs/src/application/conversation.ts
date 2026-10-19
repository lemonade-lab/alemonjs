import type { ActionTarget, ReceivedMessage, MessageMediaItem, MessageReceipt } from '../types/index.js';
import { getCurrentEvent } from './runtime/hook-event-context.js';

export type ConversationEvent = {
  Platform?: string;
  BotId?: string;
  Target?: ActionTarget;
  GuildId?: string;
  SpaceId?: string;
  OpenId?: string;
  ChannelId?: string;
  UserId?: string;
  UserName?: string;
  IsPrivate?: boolean;
  IsBot?: boolean;
  MessageId?: string;
  MessageText?: string;
  MessageMedia?: MessageMediaItem[];
  MessageContent?: ReceivedMessage;
  OccurredAt?: number;
};
export type ConversationEntry = {
  id: string;
  referenceId?: string;
  userId?: string;
  userName?: string;
  text: string;
  timestamp: number;
  isBot: boolean;
  attachments: MessageMediaItem[];
};
export type ConversationQuote = { referenceId: string; source: 'index' | 'elements' | 'missing'; message?: ConversationEntry };
export type ConversationSnapshot = { scope: string; history: ConversationEntry[]; quote?: ConversationQuote };
export type ConversationRecord = { expiresAt: number; history: ConversationEntry[]; references: ConversationEntry[] };
type MaybePromise<T> = T | Promise<T>;
/** Stores are called serially per scope within one service. Shared stores must
 * provide their own distributed coordination when multiple processes write. */
export interface ConversationStore {
  get(scope: string): MaybePromise<ConversationRecord | undefined>;
  set(scope: string, value: ConversationRecord): MaybePromise<void>;
  delete?(scope: string): MaybePromise<void>;
}
export type ConversationOptions = {
  historyLimit?: number;
  referenceLimit?: number;
  contentLimit?: number;
  ttlMs?: number;
  maxScopes?: number;
  store?: ConversationStore;
};
export type PromptOptions = { historyLimit?: number; maxChars?: number; includeSender?: boolean; includeQuote?: boolean };

const positive = (value: number | undefined, fallback: number, name: string) => {
  const number = value ?? fallback;

  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return number;
};

const conversationTarget = (event: ConversationEvent): ActionTarget | undefined => {
  if (event.Target) {
    return event.Target;
  }
  if (event.SpaceId?.startsWith('GROUP:')) {
    return { scope: 'group', targetId: event.SpaceId.slice(6) };
  }
  if (event.OpenId?.startsWith('DIRECT:')) {
    return { scope: 'direct', targetId: event.OpenId.slice(7) };
  }

  const targetId = event.IsPrivate ? event.UserId : event.ChannelId || event.GuildId;

  return targetId ? { scope: event.IsPrivate ? 'c2c' : 'channel', targetId } : undefined;
};

export const conversationIdentity = (event: ConversationEvent) => {
  const target = conversationTarget(event);

  if (!event.Platform || !target?.targetId) {
    return undefined;
  }

  return JSON.stringify([event.Platform, target.BotId ?? event.BotId ?? '', target.scope, target.targetId]);
};

/** Bounded, idle-expiring process-local storage. Returned records are copies. */
export class MemoryConversationStore implements ConversationStore {
  #records = new Map<string, ConversationRecord>();
  constructor(private readonly maxScopes = 100, private readonly now = Date.now) {
    positive(maxScopes, 100, 'maxScopes');
  }
  get(scope: string) {
    const record = this.#records.get(scope);

    if (!record || record.expiresAt <= this.now()) {
      this.#records.delete(scope);

      return undefined;
    }
    this.#records.delete(scope);
    this.#records.set(scope, record);

    return structuredClone(record);
  }
  set(scope: string, value: ConversationRecord) {
    this.#records.delete(scope);
    while (this.#records.size >= this.maxScopes) {
      this.#records.delete(this.#records.keys().next().value);
    }
    this.#records.set(scope, structuredClone(value));
  }
  delete(scope: string) {
    this.#records.delete(scope);
  }
}

type ReplyRecorder = (receipt: MessageReceipt, text: string) => Promise<void>;
const replyRecorders = new WeakMap<object, ReplyRecorder>();
const snapshots = new WeakMap<object, ConversationSnapshot>();
const media = (items: MessageMediaItem[] = []) => items.slice(0, 20).map(item => ({ ...item }));

/** Records observed messages; it never fetches unseen platform history. */
export const createConversationService = (options: ConversationOptions = {}, now = Date.now) => {
  const historyLimit = positive(options.historyLimit, 50, 'historyLimit');
  const referenceLimit = positive(options.referenceLimit, 200, 'referenceLimit');
  const contentLimit = positive(options.contentLimit, 1000, 'contentLimit');
  const ttlMs = positive(options.ttlMs, 30 * 60 * 1000, 'ttlMs');
  const maxScopes = positive(options.maxScopes, 100, 'maxScopes');
  const store = options.store ?? new MemoryConversationStore(maxScopes, now);
  const queues = new Map<string, Promise<unknown>>();
  let pending = 0;

  const capture = async (event: ConversationEvent): Promise<ConversationSnapshot> => {
    const scope = conversationIdentity(event);

    if (!scope) {
      return { scope: '', history: [] };
    }
    // Bound outstanding external-store operations as well as retained memory.
    if (pending >= maxScopes * 2) {
      throw new Error('Conversation capture queue is full');
    }
    pending++;
    const previous = queues.get(scope) ?? Promise.resolve();
    const task = previous
      .catch(() => undefined)
      .then(async () => {
        const loaded = await store.get(scope);
        const record = loaded && loaded.expiresAt > now() ? loaded : { expiresAt: now() + ttlMs, history: [], references: [] };
        const referenceId = event.MessageContent?.replyReferenceId;
        let quote: ConversationQuote | undefined;

        if (referenceId) {
          const elements = event.MessageContent?.elements ?? [];
          const element =
            elements.find(item => item.referenceId === referenceId) ?? (elements.length === 1 && !elements[0].referenceId ? elements[0] : undefined);
          const indexed = record.references.find(item => item.referenceId === referenceId || item.id === referenceId);

          quote = { referenceId, source: 'missing' };
          if (element && (element.text || element.attachments?.length)) {
            quote = {
              referenceId,
              source: 'elements',
              message: {
                id: referenceId,
                referenceId,
                userId: element.userId,
                userName: element.userName,
                text: (element.text ?? '').slice(0, contentLimit),
                attachments: media(element.attachments),
                timestamp: now(),
                isBot: element.author?.IsBot === true
              }
            };
          } else if (indexed) {
            quote = { referenceId, source: 'index', message: structuredClone(indexed) };
          }
        }
        const snapshot: ConversationSnapshot = {
          scope,
          history: structuredClone(record.history.filter(item => item.id !== event.MessageId).slice(-historyLimit)),
          quote
        };
        const id = event.MessageId || event.MessageContent?.referenceId;

        if (id && !record.references.some(item => item.id === id) && !record.history.some(item => item.id === id)) {
          const entry: ConversationEntry = {
            id,
            referenceId: event.MessageContent?.referenceId,
            userId: event.UserId,
            userName: event.UserName,
            text: (event.MessageText ?? '').slice(0, contentLimit),
            timestamp: event.OccurredAt ?? now(),
            isBot: event.IsBot === true,
            attachments: media(event.MessageMedia)
          };

          record.references = [...record.references, entry].slice(-referenceLimit);
          record.history = [...record.history, entry].slice(-historyLimit);
        }
        record.expiresAt = now() + ttlMs;
        await store.set(scope, record);
        snapshots.set(event, snapshot);
        replyRecorders.set(event, async (receipt, text) => {
          if (!receipt.id) {
            throw new Error('A successful message receipt is required');
          }
          await capture({
            ...event,
            Target: conversationTarget(event),
            UserId: event.Target?.BotId ?? event.BotId,
            UserName: undefined,
            IsBot: true,
            MessageId: receipt.id,
            MessageText: text,
            MessageMedia: [],
            MessageContent: { referenceId: receipt.referenceId },
            OccurredAt: now()
          });
        });

        return structuredClone(snapshot);
      });

    queues.set(scope, task);
    try {
      return await task;
    } finally {
      pending--;
      if (queues.get(scope) === task) {
        queues.delete(scope);
      }
    }
  };

  return { capture, store };
};

const promptEntry = (entry: ConversationEntry) => ({
  userId: entry.userId,
  userName: entry.userName,
  text: entry.text,
  isBot: entry.isBot,
  attachments: entry.attachments.map(item => ({ type: item.Type, name: item.FileName, transcript: item.Transcript }))
});

/** A bounded JSON data envelope, not a system instruction or an LLM call.
 * Quoted/history text remains untrusted user content. */
export const formatConversationPrompt = (event: ConversationEvent, snapshot: ConversationSnapshot, options: PromptOptions = {}) => {
  const maxChars = positive(options.maxChars, 12000, 'maxChars');
  const limit = options.historyLimit ?? 5;

  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error('historyLimit must be a non-negative integer');
  }
  const current = promptEntry({
    id: event.MessageId ?? '',
    text: event.MessageText ?? '',
    userId: event.UserId,
    userName: event.UserName,
    attachments: media(event.MessageMedia),
    timestamp: 0,
    isBot: false
  });
  const envelope = {
    ...(options.includeSender !== false && { sender: { id: event.UserId, name: event.UserName } }),
    quote: options.includeQuote !== false && snapshot.quote?.message ? promptEntry(snapshot.quote.message) : undefined,
    history: limit ? snapshot.history.slice(-limit).map(promptEntry) : [],
    message: current
  };
  let result = JSON.stringify(envelope);

  // Remove oldest history first; preserve a valid JSON envelope within budget.
  while (result.length > maxChars && envelope.history.length) {
    envelope.history.shift();
    result = JSON.stringify(envelope);
  }
  if (result.length > maxChars) {
    envelope.quote = undefined;
    result = JSON.stringify(envelope);
  }
  while (result.length > maxChars && current.text.length) {
    current.text = current.text.slice(0, Math.max(0, current.text.length - Math.max(1, result.length - maxChars)));
    result = JSON.stringify(envelope);
  }
  if (result.length > maxChars) {
    throw new Error('maxChars is too small for conversation metadata');
  }

  return result;
};

export const useConversation = (event: ConversationEvent = getCurrentEvent() ?? {}) => {
  const snapshot = structuredClone(snapshots.get(event) ?? { scope: conversationIdentity(event) ?? '', history: [] });

  return [
    {
      ...snapshot,
      prompt: (options?: PromptOptions) => formatConversationPrompt(event, snapshot, options),
      /** Record confirmed output explicitly, using the platform's returned reference ID. */
      rememberReply: (receipt: MessageReceipt, text: string) => {
        const record = replyRecorders.get(event);

        if (!record) {
          return Promise.reject(new Error('Conversation capture is not enabled for this event'));
        }

        return record(receipt, text);
      }
    }
  ] as const;
};
