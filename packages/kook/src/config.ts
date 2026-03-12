import { getConfigValue, useUserHashKey } from 'alemonjs';
export const platform = 'kook';
export type Options = {
  token: string;
  master_key?: string[];
  master_id?: string[];
  /**
   * 隐藏不支持的消息类型
   * 开启后，不被平台原生支持的消息类型将被直接丢弃（留空），而非降级为文本占位符
   * @default false
   */
  hideUnsupported?: boolean;
};
export const getKOOKConfig = (): Options => {
  const value = getConfigValue() || {};

  return value[platform] || {};
};
export const getMaster = (UserId: string) => {
  const config = getKOOKConfig();
  const master_key = config.master_key || [];
  const master_id = config.master_id || [];
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  });
  const is = master_key.includes(UserKey) || master_id.includes(UserId);

  return [is, UserKey] as const;
};
