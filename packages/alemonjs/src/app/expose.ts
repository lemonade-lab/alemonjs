/**
 * Expose — 插件间协议通信系统
 *
 * provide/consume + watch + notify
 */

import { ExposeActionMeta, ExposeProvideConfig, ExposeListItem, ExposeWatchEvent, ExposeSchemaItem } from '../types';

// ═══════════════════════════════════════════════════
// 全局注册中心
// ═══════════════════════════════════════════════════

/** 单个 provider 的存储 */
interface ProviderEntry {
  appName: string;
  config: ExposeProvideConfig;
}

/** 按 protocol 分组的存储: Map<protocol, Map<appName, ProviderEntry>> */
const storeExpose = new Map<string, Map<string, ProviderEntry>>();

/** watch 回调列表 */
type WatchCallback = (event: ExposeWatchEvent) => void;

/** 按 protocol 存放的 watcher */
const protocolWatchers = new Map<string, Set<WatchCallback>>();

/** 全局 watcher（不指定 protocol 的） */
const globalWatchers = new Set<WatchCallback>();

// ═══════════════════════════════════════════════════
// 触发 watcher
// ═══════════════════════════════════════════════════

function emitWatch(event: ExposeWatchEvent) {
  // 触发 protocol-specific watcher
  const watchers = protocolWatchers.get(event.protocol);

  if (watchers) {
    for (const cb of watchers) {
      try {
        cb(event);
      } catch {
        // watcher 出错不影响调用链
      }
    }
  }
  // 触发全局 watcher
  for (const cb of globalWatchers) {
    try {
      cb(event);
    } catch {
      // watcher 出错不影响调用链
    }
  }
}

// ═══════════════════════════════════════════════════
// Expose — 插件间协议通信
// ═══════════════════════════════════════════════════

/**
 * 插件间协议通信
 *
 * @example
 * ```ts
 * // provider 端（通过 defineChildren 的 register 返回）
 * register() {
 *   return {
 *     expose: [
 *       { name: 'help-image', description: '...', actions: { ... } }
 *     ]
 *   }
 * }
 *
 * // consumer 端
 * const items = Expose.list('help-image');
 * items[0].invoke('read');
 *
 * // AI 端
 * Expose.schema();
 * Expose.invoke('help-image', 'plugin-a', 'read');
 * ```
 */
/**
 * 框架侧批量注册 expose 协议
 */
export function registerExpose(appName: string, configs: ExposeProvideConfig[]) {
  for (const config of configs) {
    const protocol = config.name;

    if (!storeExpose.has(protocol)) {
      storeExpose.set(protocol, new Map());
    }

    const providers = storeExpose.get(protocol);

    if (providers.has(appName)) {
      console.warn(`[expose] ${appName} already provided "${protocol}", overwriting.`);
    }

    providers.set(appName, { appName, config });
  }
}

export class Expose {
  #configs: ExposeProvideConfig[] = [];

  static create() {
    return new Expose();
  }

  /**
   * 注册协议 — 链式调用
   */
  provide(config: ExposeProvideConfig) {
    this.#configs.push(config);

    return this;
  }

  /**
   * 获取已注册的配置（框架侧使用）
   */
  getConfigs() {
    return this.#configs;
  }

  // ═══════════════════════════════════════════════
  // 消费端
  // ═══════════════════════════════════════════════

  /**
   * 列出提供者
   */
  list(protocol?: string): ExposeListItem[] {
    const result: ExposeListItem[] = [];

    if (protocol) {
      const providers = storeExpose.get(protocol);

      if (!providers) {
        return result;
      }

      for (const [, entry] of providers) {
        result.push(createListItem(entry, protocol));
      }
    } else {
      for (const [proto, providers] of storeExpose) {
        for (const [, entry] of providers) {
          result.push(createListItem(entry, proto));
        }
      }
    }

    return result;
  }

  /**
   * 直接调用 — AI 友好
   */
  invoke(protocol: string, appName: string, action: string, value?: any): any {
    const providers = storeExpose.get(protocol);

    if (!providers) {
      throw new Error(`[expose] protocol "${protocol}" not found`);
    }

    const entry = providers.get(appName);

    if (!entry) {
      throw new Error(`[expose] provider "${appName}" not found in protocol "${protocol}"`);
    }

    const actionMeta = entry.config.actions[action];

    if (!actionMeta) {
      throw new Error(`[expose] action "${action}" not found in "${protocol}" of "${appName}"`);
    }

    const result = actionMeta.handler(value);

    // 非 read 操作自动触发 watch
    if (action !== 'read') {
      emitWatch({
        name: appName,
        protocol,
        action,
        value
      });
    }

    return result;
  }

  /**
   * 全量元信息 — AI 发现用
   */
  schema(): ExposeSchemaItem[] {
    const result: ExposeSchemaItem[] = [];

    for (const [protocol, providers] of storeExpose) {
      // 取第一个 provider 的 config 作为协议描述（所有同协议 provider 应共享同一 actions 定义）
      const firstEntry = providers.values().next().value;

      if (!firstEntry) {
        continue;
      }

      const actions: ExposeSchemaItem['actions'] = {};

      for (const [actionName, meta] of Object.entries<ExposeActionMeta>(firstEntry.config.actions)) {
        actions[actionName] = {
          description: meta.description,
          ...(meta.params ? { params: meta.params } : {}),
          ...(meta.returns ? { returns: meta.returns } : {})
        };
      }

      result.push({
        protocol,
        description: firstEntry.config.description,
        providers: Array.from(providers.keys()).map(name => ({ name })),
        actions,
        invoke: 'Expose.invoke(protocol, appName, action, value?)'
      });
    }

    return result;
  }

  /**
   * 监听变更
   */
  watch(protocolOrCallback: string | WatchCallback, callback?: WatchCallback): () => void {
    if (typeof protocolOrCallback === 'function') {
      // 全局监听
      const cb = protocolOrCallback;

      globalWatchers.add(cb);

      return () => {
        globalWatchers.delete(cb);
      };
    }

    // 协议监听
    const protocol = protocolOrCallback;

    if (!callback) {
      throw new Error('[expose] watch(protocol, callback) requires a callback');
    }

    if (!protocolWatchers.has(protocol)) {
      protocolWatchers.set(protocol, new Set());
    }

    protocolWatchers.get(protocol).add(callback);

    return () => {
      const set = protocolWatchers.get(protocol);

      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          protocolWatchers.delete(protocol);
        }
      }
    };
  }
}

// ═══════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════

function createListItem(entry: ProviderEntry, protocol: string): ExposeListItem {
  const actions: ExposeListItem['actions'] = {};

  for (const [actionName, meta] of Object.entries<ExposeActionMeta>(entry.config.actions)) {
    actions[actionName] = {
      description: meta.description,
      ...(meta.params ? { params: meta.params } : {}),
      ...(meta.returns ? { returns: meta.returns } : {})
    };
  }

  return {
    name: entry.appName,
    protocol,
    description: entry.config.description,
    actions,
    invoke(action: string, value?: any) {
      const actionMeta = entry.config.actions[action];

      if (!actionMeta) {
        throw new Error(`[expose] action "${action}" not found in "${protocol}" of "${entry.appName}"`);
      }

      const result = actionMeta.handler(value);

      if (action !== 'read') {
        emitWatch({
          name: entry.appName,
          protocol,
          action,
          value
        });
      }

      return result;
    }
  };
}

// ═══════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════

/**
 * 清理指定插件的所有 expose 注册
 * 在 ChildrenApp.un() 时调用
 */
export function disposeExpose(appName: string) {
  for (const [protocol, providers] of storeExpose) {
    providers.delete(appName);
    if (providers.size === 0) {
      storeExpose.delete(protocol);
    }
  }
}

/**
 * 清理全部（测试用）
 */
export function clearAllExpose() {
  storeExpose.clear();
  protocolWatchers.clear();
  globalWatchers.clear();
}
