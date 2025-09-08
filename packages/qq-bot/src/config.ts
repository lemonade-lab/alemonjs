import { getConfigValue, useUserHashKey } from 'alemonjs';
import { Options as sdkOptions } from './sdk/typing';
export const platform = 'qq-bot';

export type Options = {
  /**
   * 主人-用户KEY
   */
  master_key?: string[];
  /**
   * 主人-用户ID
   */
  master_id?: string[];
} & sdkOptions;

export const getQQBotConfig = (): Options => {
  const value = getConfigValue() || {};

  return value[platform] || {};
};
export const getMaster = (UserId: string) => {
  const config = getQQBotConfig();
  const master_key = config.master_key || [];
  const master_id = config.master_id || [];
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  });
  const is = master_key.includes(UserKey) || master_id.includes(UserId);

  return [is, UserKey] as const;
};
