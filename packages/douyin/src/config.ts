import { createUserHashKey, getConfigValue, isMaster } from 'alemonjs/common';

export const platform = 'douyin';
export const platformFullName = '@alemonjs/douyin';

/**
 * Direct SDK mode owns persisted sessions; an explicit gateway owns its own
 * authorization. Neither mode may expose credentials through CBP events.
 */
export type Options = {
  /** Local or private WebSocket bridge which speaks the protocol in README.md. */
  gateway?: string;
  /** Optional bearer token shared with the bridge. */
  token?: string;
  /** The logged-in Douyin account ID, used as the bot ID in Alemon events. */
  bot_id?: string;
  /** Direct SDK account storage; no gateway required. */
  accounts_dir?: string;
  disabled_accounts?: string[];
  /** Start QR login if no saved accounts exist. Default true. */
  login_qrcode?: boolean;
  reconnect_interval?: number;
  master_key?: string[];
  master_id?: string[];
  hideUnsupported?: boolean | number;
};

export const getDouyinConfig = (): Options => {
  const value = getConfigValue() || {};

  return { ...(value[platform] || {}), ...(value[platformFullName] || {}) } as Options;
};

export const getMaster = (UserId: string) => [isMaster(UserId, platform), createUserHashKey({ Platform: platform, UserId })] as const;
