import { ConversationEvent } from "./conversation.js";
//#region src/application/rate-limit.d.ts
type RateLimitTier = {
  max: number;
  windowMs: number;
};
type RateLimitOptions = {
  sender?: RateLimitTier;
  group?: RateLimitTier;
  global?: RateLimitTier;
  maxBuckets?: number;
  onLimit?: (event: ConversationEvent, decision: Exclude<RateLimitDecision, {
    allowed: true;
  }>) => void | Promise<void>;
};
type RateLimitDecision = {
  allowed: true;
} | {
  allowed: false;
  tier: 'sender' | 'group' | 'global';
  retryAfterMs: number;
};
/** All tiers are checked before reserving quota. Rejected messages do not
 * consume another tier's budget. Global covers this limiter's whole process. */
declare const createRateLimiter: (options: RateLimitOptions, now?: () => number) => {
  check: (event: ConversationEvent) => RateLimitDecision;
  clear: () => void;
};
//#endregion
export { RateLimitDecision, RateLimitOptions, RateLimitTier, createRateLimiter };