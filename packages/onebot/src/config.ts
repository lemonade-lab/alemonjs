import { createUserHashKey, getConfigValue, isMaster } from 'alemonjs';
export const platform = 'onebot';
export const platformFullName = '@alemonjs/onebot';

export type OneBotVersion = 11 | 12;

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
  /** OneBot 12 is an experimental WebSocket-only implementation. */
  version?: OneBotVersion;
  /** Default v12 bot for active sends: `<platform>:<user_id>`. */
  default_bot?: string;
};
export const getOneBotConfig = (): Options => {
  const value = getConfigValue() || {};
  const commonValue = value[platform] || {};
  const bagValue = value[platformFullName] || {};

  return { ...commonValue, ...bagValue } as Options;
};

/** Fail early instead of silently starting a bot with an ambiguous protocol. */
export const validateOneBotConfig = (config: Options): asserts config is Options & { version: OneBotVersion } => {
  const version = config.version ?? 11;

  if (version !== 11 && version !== 12) {
    throw new Error(`[OneBot] 配置 onebot.version 必须是 11 或 12，当前值为 ${String(version)}`);
  }
  if (config.default_bot && !/^[^:\s]+:[^:\s]+$/.test(config.default_bot)) {
    throw new Error('[OneBot] 配置 onebot.default_bot 必须为 <platform>:<user_id>，例如 qq:123456');
  }
  config.version = version;
};

export const getMaster = (UserId: string) => {
  const isMasterUser = isMaster(UserId, platform);
  const UserKey = createUserHashKey({
    Platform: platform,
    UserId
  });

  return [isMasterUser, UserKey] as const;
};
