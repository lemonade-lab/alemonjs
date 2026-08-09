import { createUserHashKey, getConfigValue, isMaster } from 'alemonjs';
import { Options as sdkOptions } from './sdk/typing';
export const platform = 'qq-bot';
export const platformFullName = '@alemonjs/qq-bot';

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
  /** Multi-bot mode. Keys are BotId/AppId; each child overrides common options. */
  bots?: Record<string, Omit<sdkOptions, 'app_id'> & { app_id?: string }>;
  /** Required for proactive actions without BotId when more than one bot is configured. */
  default_bot?: string;
} & sdkOptions;

export const getQQBotConfig = (): Options => {
  const value = getConfigValue() || {};
  const commonValue = value[platform] || {};
  const bagValue = value[platformFullName] || {};

  return { ...commonValue, ...bagValue } as Options;
};

/** Converts legacy single-bot configuration into the same representation as multi-bot mode. */
export const getQQBotBots = (): { bots: Map<string, sdkOptions>; defaultBot?: string } => {
  const config = getQQBotConfig();
  const {
    bots: configuredBots,
    default_bot,
    master_id: _masterId,
    master_key: _masterKey,
    markdownToText: _markdown,
    hideUnsupported: _hide,
    ...common
  } = config;
  const bots = new Map<string, sdkOptions>();

  if (configuredBots && Object.keys(configuredBots).length) {
    for (const [botId, value] of Object.entries(configuredBots)) {
      if (value.app_id && value.app_id !== botId) throw new Error(`qq-bot bots.${botId}.app_id must match its map key`);
      if (!value.secret) throw new Error(`qq-bot bots.${botId}.secret is required`);
      bots.set(botId, { ...common, ...value, app_id: botId, secret: value.secret });
    }
  } else if (config.app_id && config.secret) {
    bots.set(config.app_id, common as sdkOptions);
  }

  if (bots.size > 1 && !default_bot) throw new Error('qq-bot.default_bot is required when multiple bots are configured');
  if (default_bot && !bots.has(default_bot)) throw new Error(`qq-bot.default_bot ${default_bot} is not configured`);

  return { bots, defaultBot: default_bot || (bots.size === 1 ? bots.keys().next().value : undefined) };
};
export const getIdentity = (UserId: string) => {
  const isMasterUser = UserId ? isMaster(UserId, platform) : false;
  const UserKey = createUserHashKey({
    Platform: platform,
    UserId
  });

  return [isMasterUser, UserKey] as const;
};

export const getMaster = (UserId: string) => {
  return getIdentity(UserId);
};
