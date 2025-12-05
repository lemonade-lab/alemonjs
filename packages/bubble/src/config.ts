import { getConfigValue, useUserHashKey } from 'alemonjs';
import { BUBBLEOptions } from './sdk/wss.types';
import { GATEWAY_URL, API_URL, CDN_URL } from './sdk/api.js';

export type Options = BUBBLEOptions & {
  /**
   * 主人钥匙
   */
  master_key?: string[];
  /**
   * 主人ID
   */
  master_id?: string[];
  /**
   * WebSocket 代理配置
   */
  websocket_proxy?: string;
  /**
   * HTTP 请求代理配置
   */
  request_proxy?: string;
  /**
   * 自定义请求配置
   */
  request_config?: any;
  /**
   * WebSocket 客户端选项
   */
  websocket_options?: any;
  /**
   * 客户端名称（用于 X-Client header）
   */
  clientName?: string;
  /**
   * WebSocket Gateway URL（如果未提供，使用默认值）
   */
  URL?: string;
};

// 平台
export const platform = 'bubble';

export const getBubbleConfig = (): Options & {
  [key: string]: any;
} => {
  const value = getConfigValue() || {};
  const config = value[platform] || {};

  // 如果没有提供 URL，使用配置中的 GATEWAY_URL 或默认值
  if (!config.URL && !config.GATEWAY_URL) {
    config.URL = GATEWAY_URL;
  } else if (config.GATEWAY_URL && !config.URL) {
    config.URL = config.GATEWAY_URL;
  }

  // 如果没有提供 API_URL，使用默认值
  if (!config.API_URL) {
    config.API_URL = API_URL;
  }

  // 如果没有提供 CDN_URL，使用默认值
  if (!config.CDN_URL) {
    config.CDN_URL = CDN_URL;
  }

  return config;
};

export const getMaster = (UserId: string) => {
  const config = getBubbleConfig();
  const masterKey = config.master_key || [];
  const masterId = config.master_id || [];
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  });
  const is = masterKey.includes(UserKey) || masterId.includes(UserId);

  return [is, UserKey] as const;
};
