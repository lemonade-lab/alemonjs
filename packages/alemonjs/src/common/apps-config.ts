import { validateCommandConfig, type CommandConfig } from './command-config.js';
import { logger } from './logger.js';

export type AppEntry = { name: string; enabled?: boolean; order?: number; command?: CommandConfig };
export type AppOptions = { enabled?: boolean; order?: number; command?: CommandConfig };
/** 模块名是唯一 key；数组仅用于兼容旧配置。 */
export type AppsConfig = Record<string, boolean | AppOptions> | string[];
export type NormalizedAppEntry = Required<Omit<AppEntry, 'command'>> & Pick<AppEntry, 'command'>;

/** 模块映射使用显式序号；兼容旧数组和布尔映射，同序号保持声明顺序。 */
export function normalizeAppsConfig(input: unknown): NormalizedAppEntry[] {
  if (input === undefined || input === null) {
    return [];
  }
  const warn = (message: string) => logger.warn(`[apps] ${message}`);
  let entries: unknown[];

  if (Array.isArray(input)) {
    entries = input;
  } else if (typeof input === 'object') {
    entries = Object.entries(input).map(([name, value]) => {
      if (typeof value === 'boolean') {
        return { name, enabled: value };
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return { ...value, name };
      }

      return null;
    });
  } else {
    warn('配置必须是模块映射或旧版名称数组，已忽略。');

    return [];
  }
  const names = new Set<string>();
  const result: NormalizedAppEntry[] = [];

  entries.forEach((entry, index) => {
    const item = typeof entry === 'string' ? { name: entry } : entry;

    if (!item || typeof item !== 'object' || Array.isArray(item) || !('name' in item) || typeof item.name !== 'string' || !item.name.trim()) {
      warn(`第 ${index + 1} 项应用名称无效，已忽略。`);

      return;
    }
    const name = item.name.trim();
    const enabled = 'enabled' in item ? item.enabled : true;
    const order = 'order' in item ? item.order : index;

    if (typeof enabled !== 'boolean' || typeof order !== 'number' || !Number.isSafeInteger(order)) {
      warn(`应用 ${name} 的 enabled 必须为布尔值，order 必须为安全整数，已忽略。`);

      return;
    }
    if (names.has(name)) {
      warn(`应用 ${name} 重复，保留首次有效声明。`);

      return;
    }
    if ('command' in item && item.command !== undefined) validateCommandConfig(item.command, name);
    names.add(name);
    result.push({ name, enabled, order, ...('command' in item && item.command !== undefined ? { command: item.command as CommandConfig } : {}) });
  });

  return result.sort((a, b) => a.order - b.order);
}

/** 顺序等待每个应用初始化，确保配置顺序落实到加载过程。 */
export async function loadConfiguredApps(input: unknown, load: (name: string) => Promise<unknown>): Promise<void> {
  for (const app of normalizeAppsConfig(input)) {
    if (app.enabled) {
      await load(app.name);
    }
  }
}
