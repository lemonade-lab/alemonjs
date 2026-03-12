import { getConfigValue, useUserHashKey } from 'alemonjs';
export const platform = 'onebot';

export type Options = {
  url: string;
  token?: string;
  reverse_enable?: boolean;
  reverse_port: number; // 17158
  master_key?: string[];
  master_id?: string[];
  /**
   * 隐藏不支持的消息类型
   * 开启后，不被平台原生支持的消息类型将被直接丢弃（留空），而非降级为文本占位符
   * @default false
   */
  hideUnsupported?: boolean;
};
export const getOneBotConfig = (): Options => {
  const value = getConfigValue() || {};

  return value[platform] || {};
};

export const getMaster = (UserId: string) => {
  const config = getOneBotConfig();
  const masterKey = config.master_key || [];
  const masterId = config.master_id || [];
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  });
  const is = masterKey.includes(UserKey) || masterId.includes(UserId);

  return [is, UserKey] as const;
};
