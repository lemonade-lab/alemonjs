import type { ConversationEvent } from './conversation.js';
import { conversationIdentity } from './conversation.js';

export type RateLimitTier = { max: number; windowMs: number };
export type RateLimitOptions = {
  sender?: RateLimitTier;
  group?: RateLimitTier;
  global?: RateLimitTier;
  maxBuckets?: number;
  onLimit?: (event: ConversationEvent, decision: Exclude<RateLimitDecision, { allowed: true }>) => void | Promise<void>;
};
export type RateLimitDecision = { allowed: true } | { allowed: false; tier: 'sender' | 'group' | 'global'; retryAfterMs: number };

/** All tiers are checked before reserving quota. Rejected messages do not
 * consume another tier's budget. Global covers this limiter's whole process. */
export const createRateLimiter = (options: RateLimitOptions, now = Date.now) => {
  const buckets = new Map<string, number[]>();
  const maxBuckets = options.maxBuckets ?? 10000;

  if (!Number.isSafeInteger(maxBuckets) || maxBuckets < 1) {
    throw new Error('maxBuckets must be a positive integer');
  }
  for (const tier of [options.sender, options.group, options.global]) {
    if (tier && (!Number.isSafeInteger(tier.max) || tier.max < 1 || !Number.isSafeInteger(tier.windowMs) || tier.windowMs < 1)) {
      throw new Error('Rate limits require positive integer max and windowMs');
    }
  }
  const windows = new Map<string, number>();
  const check = (event: ConversationEvent): RateLimitDecision => {
    const time = now();
    const tiers: { tier: 'sender' | 'group' | 'global'; key: string; rule: RateLimitTier }[] = [];
    const bot = [event.Platform ?? '', event.Target?.BotId ?? event.BotId ?? ''];
    const scope = conversationIdentity(event);
    const privateMessage = event.Target?.scope === 'c2c' || event.Target?.scope === 'direct' || event.IsPrivate;

    if (options.global) {
      tiers.push({ tier: 'global', key: 'global', rule: options.global });
    }
    if (options.group && scope && !privateMessage) {
      tiers.push({ tier: 'group', key: `group:${scope}`, rule: options.group });
    }
    if (options.sender && event.UserId) {
      tiers.push({ tier: 'sender', key: `sender:${JSON.stringify([...bot, event.UserId])}`, rule: options.sender });
    }
    // Expired keys can be reclaimed without evicting active counters.
    const missingKeys = tiers.filter(item => !buckets.has(item.key)).length;

    if (buckets.size + missingKeys > maxBuckets) {
      for (const [key, entries] of buckets) {
        if (!entries.length || entries.at(-1) + windows.get(key) <= time) {
          buckets.delete(key);
          windows.delete(key);
        }
      }
    }
    let newKeys = 0;

    for (const { tier, key, rule } of tiers) {
      const entries = buckets.get(key) ?? [];

      while (entries.length && entries[0] + rule.windowMs <= time) {
        entries.shift();
      }
      if (entries.length >= rule.max) {
        return { allowed: false, tier, retryAfterMs: Math.max(1, entries[0] + rule.windowMs - time) };
      }
      if (!buckets.has(key)) {
        newKeys++;
      }
      if (buckets.size + newKeys > maxBuckets) {
        return { allowed: false, tier, retryAfterMs: rule.windowMs };
      }
    }
    for (const { key, rule } of tiers) {
      const entries = buckets.get(key) ?? [];

      entries.push(time);
      buckets.set(key, entries);
      windows.set(key, rule.windowMs);
    }

    return { allowed: true };
  };

  return {
    check,
    clear: () => {
      buckets.clear();
      windows.clear();
    }
  };
};
