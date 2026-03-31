import { getConfigValue, isMaster } from 'alemonjs';
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
   * - true 或 1：一级隐藏，不可读占位符（[视频]、[音频]等）被置空，可读内容保留
   * - 2：二级隐藏，按钮仅显示指令数据，链接仅显示 URL
   * - 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
   * - 4：四级隐藏，不进行任何转换，直接丢弃
   * @default false
   */
  hideUnsupported?: boolean | number;
} & sdkOptions;

export const getQQBotConfig = (): Options => {
  const value = getConfigValue() || {};

  return value[platform] || {};
};
export const getMaster = (UserId: string) => {
  return isMaster(UserId, platform);
};
