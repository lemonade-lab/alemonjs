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
   * 开启后，不被平台原生支持的消息类型将被直接丢弃（留空），而非降级为文本占位符
   * @default false
   */
  hideUnsupported?: boolean;
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
