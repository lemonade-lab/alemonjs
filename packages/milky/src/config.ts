import { createUserHashKey, getConfigValue, isMaster } from 'alemonjs';
export const platform = 'milky';
export const platformFullName = '@alemonjs/milky';

export type MilkyConnection = 'ws' | 'sse' | 'webhook';

export type Options = {
  host: string;
  port: number;
  prefix?: string;
  connection?: MilkyConnection;
  access_token?: string;
  http_timeout?: number;
  heartbeat?: number;
  reconnect_interval?: number;
  webhook_path?: string;
  webhook_port?: number;
  master_key?: string[];
  master_id?: string[];
};

export const getMilkyConfig = (): Options => {
  const value = getConfigValue() || {};
  const commonValue = value[platform] || {};
  const bagValue = value[platformFullName] || {};

  return { ...commonValue, ...bagValue } as Options;
};

export type ValidatedMilkyConfig = Options & {
  host: string;
  port: number;
  connection: MilkyConnection;
  http_timeout: number;
  heartbeat: number;
  reconnect_interval: number;
  webhook_path: string;
  webhook_port: number;
};

/** Fail early instead of silently starting with an unusable connection. */
export const validateMilkyConfig = (config: Options): ValidatedMilkyConfig => {
  const host = config.host ?? '127.0.0.1';
  const port = Number(config.port ?? 8080);
  const connection = config.connection ?? 'ws';
  const http_timeout = Number(config.http_timeout ?? 15);
  const heartbeat = Number(config.heartbeat ?? 30);
  const reconnect_interval = Number(config.reconnect_interval ?? 10);
  const webhook_path = config.webhook_path ?? '/milky';
  const webhook_port = Number(config.webhook_port ?? 17159);

  if (!host) {
    throw new Error('[Milky] 配置 milky.host 不能为空');
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`[Milky] 配置 milky.port 必须在 0~65535 之间，当前值为 ${String(port)}`);
  }
  if (!['ws', 'sse', 'webhook'].includes(connection)) {
    throw new Error(`[Milky] 配置 milky.connection 必须是 ws、sse 或 webhook，当前值为 ${String(connection)}`);
  }
  if (http_timeout <= 0) {
    throw new Error(`[Milky] 配置 milky.http_timeout 必须大于 0，当前值为 ${String(http_timeout)}`);
  }
  if (heartbeat <= 0) {
    throw new Error(`[Milky] 配置 milky.heartbeat 必须大于 0，当前值为 ${String(heartbeat)}`);
  }
  if (reconnect_interval <= 0) {
    throw new Error(`[Milky] 配置 milky.reconnect_interval 必须大于 0，当前值为 ${String(reconnect_interval)}`);
  }
  if (!webhook_path.startsWith('/')) {
    throw new Error('[Milky] 配置 milky.webhook_path 必须以 / 开头');
  }
  if (!Number.isInteger(webhook_port) || webhook_port < 0 || webhook_port > 65535) {
    throw new Error(`[Milky] 配置 milky.webhook_port 必须在 0~65535 之间，当前值为 ${String(webhook_port)}`);
  }

  config.host = host;
  config.port = port;
  config.connection = connection;
  config.http_timeout = http_timeout;
  config.heartbeat = heartbeat;
  config.reconnect_interval = reconnect_interval;
  config.webhook_path = webhook_path;
  config.webhook_port = webhook_port;

  return config as ValidatedMilkyConfig;
};

export const getMaster = (UserId: string) => {
  const isMasterUser = isMaster(UserId, platform);
  const UserKey = createUserHashKey({
    Platform: platform,
    UserId
  });

  return [isMasterUser, UserKey] as const;
};
