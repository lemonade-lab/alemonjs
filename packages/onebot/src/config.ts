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
   * - true 或 1：一级隐藏，不可读占位符（[视频]、[音频]等）被置空，可读内容保留
   * - 2：二级隐藏，按钮仅显示指令数据，链接仅显示 URL，MD mention 降级为原生 mention
   * - 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
   * - 4：四级隐藏，不进行任何转换，直接丢弃
   * @default false
   */
  hideUnsupported?: boolean | number;
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
