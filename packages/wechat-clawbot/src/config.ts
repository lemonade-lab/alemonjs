import { getConfigValue, isMaster, createUserHashKey } from 'alemonjs';
import path from 'node:path';
import os from 'node:os';

export const platform = 'wechat-clawbot';

export interface WechatConfig {
  base_url?: string;
  cdn_base_url?: string;
  storage_dir?: string;
  log_level?: 'debug' | 'info' | 'warn' | 'error';
  qr_poll_interval?: number;
  api_timeout?: number;
  long_poll_timeout?: number;
  auto_relogin?: boolean;
}

export const DEFAULT_CONFIG: Required<WechatConfig> = {
  base_url: 'https://ilinkai.weixin.qq.com',
  cdn_base_url: 'https://novac2c.cdn.weixin.qq.com/c2c',
  storage_dir: path.join(os.homedir(), '.alemonjs-wechat'),
  log_level: 'info',
  qr_poll_interval: 2000,
  api_timeout: 15000,
  long_poll_timeout: 35000,
  auto_relogin: true
};

export const getWechatConfig = (): Required<WechatConfig> => {
  const value = getConfigValue() || {};
  return { ...DEFAULT_CONFIG, ...(value[platform] || {}) };
};

export const getIdentity = (UserId: string): [boolean, string] => {
  const isMasterUser = UserId ? isMaster(UserId, platform) : false;
  const UserKey = createUserHashKey({
    Platform: platform,
    UserId
  });
  return [isMasterUser, UserKey];
};

export const getMaster = (UserId: string): [boolean, string] => {
  return getIdentity(UserId);
};
