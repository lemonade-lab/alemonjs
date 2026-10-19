import { AsyncLocalStorage } from "node:async_hooks";
//#region src/common/runtime-scope.d.ts
/** Internal dependency boundary. Production execution keeps its existing defaults. */
type RuntimeScope = {
  resources: Map<symbol, unknown>;
  cleanups: Set<() => void>;
  disposed: boolean;
  now: () => number;
  action: (request: any) => Promise<any[]>;
  api: (request: any) => Promise<any[]>;
  timers?: {
    set: (callback: () => void, ms: number, repeat: boolean) => any;
    clear: (handle: any) => void;
  };
};
type RuntimeExecution = {
  appName?: string;
  pending: Set<Promise<unknown>>;
  errors: unknown[];
  reasons: string[];
  contextClaimed: boolean;
  closed?: boolean;
};
declare const runtimeScope: AsyncLocalStorage<RuntimeScope>;
declare const runtimeExecution: AsyncLocalStorage<RuntimeExecution>;
declare const runtimeNow: () => number;
declare function scopedResource<T>(key: symbol, create: () => T, fallback: T): T;
/** Proxy keeps exported collection references stable while isolating their contents. */
declare function scopedMap<K, V>(): Map<K, V>;
declare function scopedSet<T>(): Set<T>;
/** Observe detached framework work without changing production rejection semantics. */
declare function trackRuntimeTask<T>(task: T, reportError?: boolean): T;
declare const recordRuntimeError: (error: unknown) => void;
declare const runtimeSetTimeout: typeof setTimeout;
declare const runtimeSetInterval: typeof setInterval;
declare const runtimeClearTimeout: typeof clearTimeout;
declare const runtimeClearInterval: typeof clearInterval;
//#endregion
export { RuntimeExecution, RuntimeScope, recordRuntimeError, runtimeClearInterval, runtimeClearTimeout, runtimeExecution, runtimeNow, runtimeScope, runtimeSetInterval, runtimeSetTimeout, scopedMap, scopedResource, scopedSet, trackRuntimeTask };