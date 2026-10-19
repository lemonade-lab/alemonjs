import { MessageMediaItem } from "../types/event/base/message.js";
import { ActionTarget } from "../types/actions.js";
import { MessageReceipt, ReceivedMessage } from "../types/messaging.js";
import "../types/index.js";
//#region src/application/conversation.d.ts
type ConversationEvent = {
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
type ConversationEntry = {
  id: string;
  referenceId?: string;
  userId?: string;
  userName?: string;
  text: string;
  timestamp: number;
  isBot: boolean;
  attachments: MessageMediaItem[];
};
type ConversationQuote = {
  referenceId: string;
  source: 'index' | 'elements' | 'missing';
  message?: ConversationEntry;
};
type ConversationSnapshot = {
  scope: string;
  history: ConversationEntry[];
  quote?: ConversationQuote;
};
type ConversationRecord = {
  expiresAt: number;
  history: ConversationEntry[];
  references: ConversationEntry[];
};
type MaybePromise<T> = T | Promise<T>;
/** Stores are called serially per scope within one service. Shared stores must
 * provide their own distributed coordination when multiple processes write. */
interface ConversationStore {
  get(scope: string): MaybePromise<ConversationRecord | undefined>;
  set(scope: string, value: ConversationRecord): MaybePromise<void>;
  delete?(scope: string): MaybePromise<void>;
}
type ConversationOptions = {
  historyLimit?: number;
  referenceLimit?: number;
  contentLimit?: number;
  ttlMs?: number;
  maxScopes?: number;
  store?: ConversationStore;
};
type PromptOptions = {
  historyLimit?: number;
  maxChars?: number;
  includeSender?: boolean;
  includeQuote?: boolean;
};
declare const conversationIdentity: (event: ConversationEvent) => string;
/** Bounded, idle-expiring process-local storage. Returned records are copies. */
declare class MemoryConversationStore implements ConversationStore {
  #private;
  private readonly maxScopes;
  private readonly now;
  constructor(maxScopes?: number, now?: () => number);
  get(scope: string): ConversationRecord;
  set(scope: string, value: ConversationRecord): void;
  delete(scope: string): void;
}
/** Records observed messages; it never fetches unseen platform history. */
declare const createConversationService: (options?: ConversationOptions, now?: () => number) => {
  capture: (event: ConversationEvent) => Promise<ConversationSnapshot>;
  store: ConversationStore;
};
/** A bounded JSON data envelope, not a system instruction or an LLM call.
 * Quoted/history text remains untrusted user content. */
declare const formatConversationPrompt: (event: ConversationEvent, snapshot: ConversationSnapshot, options?: PromptOptions) => string;
declare const useConversation: (event?: ConversationEvent) => readonly [{
  readonly scope: string;
  readonly history: ConversationEntry[];
  readonly quote?: ConversationQuote;
  readonly prompt: (options?: PromptOptions) => string;
  /** Record confirmed output explicitly, using the platform's returned reference ID. */
  readonly rememberReply: (receipt: MessageReceipt, text: string) => Promise<void>;
}];
//#endregion
export { ConversationEntry, ConversationEvent, ConversationOptions, ConversationQuote, ConversationRecord, ConversationSnapshot, ConversationStore, MemoryConversationStore, PromptOptions, conversationIdentity, createConversationService, formatConversationPrompt, useConversation };