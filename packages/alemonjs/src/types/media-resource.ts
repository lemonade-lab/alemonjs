import type { ActionTarget } from './actions';

export type MediaUsage = 'message' | 'markdown';
/** Exactly one source; JSON-safe across the framework transport. */
export type MediaSourceInput = (
  | { url: string; filePath?: never; data?: never }
  | { filePath: string; url?: never; data?: never }
  | { data: string; url?: never; filePath?: never }
) & { name?: string };
export type MediaImageSource = { kind: 'media-source'; type: 'image'; source: MediaSourceInput };
/** A platform resource is not a portable source. Its reference is opaque. */
export type MediaResource = {
  kind: 'media-resource';
  type: 'image';
  id: string;
  owner: { platform: string; botId: string };
  usage: MediaUsage;
  reference: string;
  name?: string;
  target?: ActionTarget;
  expiration?: { mode: 'fixed' | 'sliding' | 'unknown'; windowSeconds?: number; expiresAt?: number };
};
export type MediaImage = MediaImageSource | MediaResource;
export type MediaResourcePage = { Items: MediaResource[]; NextCursor?: string; Total?: number };
export type MediaCapabilities = {
  usages: Partial<Record<MediaUsage, { upload: boolean; list: boolean; delete: boolean; maxBytes?: number; maxItems?: number }>>;
};

export type MediaSendResult = import('../common/result').Result<import('./messaging').MessageReceipt> & {
  media?: { stage: 'prepare' | 'send'; resources: MediaResource[]; failure?: unknown };
};
