import { AsyncLocalStorage } from 'node:async_hooks';

// 插件身份独立于聊天事件：生命周期不需要伪造 event 或 next。
const appContext = new AsyncLocalStorage<{ name?: string }>();

export function withAppContext<T>(name: string | undefined, runner: () => T): T {
  return appContext.run({ name }, runner);
}

export function currentAppContext(): { name?: string } | undefined {
  return appContext.getStore();
}
