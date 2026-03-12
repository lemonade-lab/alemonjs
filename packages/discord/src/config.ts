import { getConfigValue, useUserHashKey } from 'alemonjs';
import { DCIntentsEnum } from './sdk/types';

export interface Options {
  /**
   * 网关地址
   */
  gatewayURL?: string;
  /**
   * 钥匙
   */
  token: string;
  /**
   * 订阅(有默认值)
   * ******
   */
  intent?: DCIntentsEnum[];
  /**
   * 分片(有默认值)
   * ******
   * [0, 1]
   */
  shard?: number[];
  /**
   * 主人钥匙
   */
  master_key?: string[];
  /**
   * 主人ID
   */
  master_id?: string[];
  /**
   * 隐藏不支持的消息类型
   * - true 或 1：一级隐藏，不可读占位符（[视频]、[音频]等）被置空，可读内容保留
   * - 2：二级隐藏，按钮仅显示指令数据，链接仅显示 URL
   * - 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
   * - 4：四级隐藏，不进行任何转换，直接丢弃
   * @default false
   */
  hideUnsupported?: boolean | number;
}

// 平台
export const platform = 'discord';

export const getDiscordConfig = (): Options & {
  [key: string]: any;
} => {
  const value = getConfigValue() || {};
  const config = value[platform] || {};

  return config;
};

export const getMaster = (UserId: string) => {
  const config = getDiscordConfig();
  const master_key = config.master_key || [];
  const master_id = config.master_id || [];
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  });
  const is = master_key.includes(UserKey) || master_id.includes(UserId);

  return [is, UserKey] as const;
};
