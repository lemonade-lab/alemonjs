import { createUserHashKey, getConfigValue, isMaster } from 'alemonjs';

export const platform = 'wecom';
export const platformFullName = '@alemonjs/wecom';

export type Options = {
  bot_id: string;
  secret: string;
  master_key?: string[];
  master_id?: string[];
  hideUnsupported?: boolean | number;
};

export const getWecomConfig = (): Options => {
  const value = getConfigValue() || {};

  return { ...(value[platform] || {}), ...(value[platformFullName] || {}) } as Options;
};

export const getMaster = (UserId: string) => [isMaster(UserId, platform), createUserHashKey({ Platform: platform, UserId })] as const;
