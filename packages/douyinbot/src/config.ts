import { createUserHashKey, getConfigValue, isMaster } from 'alemonjs';

export const platform = 'douyinbot';
export const platformFullName = '@alemonjs/douyinbot';
export type Options = {
  client_key: string;
  client_secret: string;
  callback?: { host?: string; port?: number; path?: string };
  api_base_url?: string;
  master_key?: string[];
  master_id?: string[];
  hideUnsupported?: boolean | number;
};
export const getDouyinConfig = (): Options => {
  const value = getConfigValue() || {};

  return { ...(value[platform] || {}), ...(value[platformFullName] || {}) } as Options;
};
export const getMaster = (UserId: string) => [isMaster(UserId, platform), createUserHashKey({ Platform: platform, UserId })] as const;
