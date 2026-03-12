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
  /**
   * 将 Markdown 降级为纯文本发送
   * 部分机器人不支持 Markdown 消息类型，开启后 Markdown 和按钮将转为可读纯文本
   * @default false
   */
  markdownToText?: boolean;
  /**
   * 隐藏不支持的消息类型
   * 开启后，不被平台原生支持的消息类型将被直接丢弃（留空），而非降级为文本占位符
   * @default false
   */
  hideUnsupported?: boolean;
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
