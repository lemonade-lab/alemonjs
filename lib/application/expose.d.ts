import { ExposeListItem, ExposeProvideConfig, ExposeSchemaItem, ExposeWatchEvent } from "../types/expose/index.js";
import "../types/index.js";
//#region src/application/expose.d.ts
/** watch 回调列表 */
type WatchCallback = (event: ExposeWatchEvent) => void;
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
declare function registerExpose(appName: string, configs: ExposeProvideConfig[]): void;
declare class Expose {
  #private;
  static create(): Expose;
  /**
   * 注册协议 — 链式调用
   */
  provide(config: ExposeProvideConfig): this;
  /**
   * 获取已注册的配置（框架侧使用）
   */
  getConfigs(): ExposeProvideConfig[];
  /**
   * 列出提供者
   */
  list(protocol?: string): ExposeListItem[];
  /**
   * 直接调用 — AI 友好
   */
  invoke(protocol: string, appName: string, action: string, value?: any): any;
  /**
   * 全量元信息 — AI 发现用
   */
  schema(): ExposeSchemaItem[];
  /**
   * 监听变更
   */
  watch(protocolOrCallback: string | WatchCallback, callback?: WatchCallback): () => void;
}
/**
 * 清理指定插件的所有 expose 注册
 * 在 ChildrenApp.un() 时调用
 */
declare function disposeExpose(appName: string): void;
/**
 * 清理全部（测试用）
 */
declare function clearAllExpose(): void;
//#endregion
export { Expose, clearAllExpose, disposeExpose, registerExpose };