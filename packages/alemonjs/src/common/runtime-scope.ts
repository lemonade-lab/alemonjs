import { AsyncLocalStorage } from 'node:async_hooks';

/** Internal dependency boundary. Production execution keeps its existing defaults. */
export type RuntimeScope = {
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
export type RuntimeExecution = {
  appName?: string;
  pending: Set<Promise<unknown>>;
  errors: unknown[];
  reasons: string[];
  contextClaimed: boolean;
  closed?: boolean;
};
export const runtimeScope = new AsyncLocalStorage<RuntimeScope>();
export const runtimeExecution = new AsyncLocalStorage<RuntimeExecution>();
export const runtimeNow = () => runtimeScope.getStore()?.now() ?? Date.now();

export function scopedResource<T>(key: symbol, create: () => T, fallback: T): T {
  const scope = runtimeScope.getStore();

  if (!scope) {
    return fallback;
  }
  if (scope.disposed) {
    throw new Error('Test app is disposed');
  }
  if (!scope.resources.has(key)) {
    scope.resources.set(key, create());
  }

  return scope.resources.get(key) as T;
}

/** Proxy keeps exported collection references stable while isolating their contents. */
export function scopedMap<K, V>(): Map<K, V> {
  const key = Symbol();
  const fallback = new Map<K, V>();

  return new Proxy(fallback, {
    get(_target, property) {
      const target = scopedResource(key, () => new Map<K, V>(), fallback);
      const value = Reflect.get(target, property, target);

      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}
export function scopedSet<T>(): Set<T> {
  const key = Symbol();
  const fallback = new Set<T>();

  return new Proxy(fallback, {
    get(_target, property) {
      const target = scopedResource(key, () => new Set<T>(), fallback);
      const value = Reflect.get(target, property, target);

      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

/** Observe detached framework work without changing production rejection semantics. */
export function trackRuntimeTask<T>(task: T, reportError = true): T {
  const execution = runtimeExecution.getStore();

  if (execution && task && typeof (task as any).then === 'function') {
    const promise = Promise.resolve(task);

    execution.pending.add(promise);
    void promise.then(
      () => execution.pending.delete(promise),
      error => {
        if (reportError) {
          execution.errors.push(error);
        }
        execution.pending.delete(promise);
      }
    );
  }

  return task;
}
export const recordRuntimeError = (error: unknown) => {
  runtimeExecution.getStore()?.errors.push(error);
};

const scheduledCallback = (callback: () => void) => () => {
  if (runtimeScope.getStore()?.disposed) {
    return;
  }
  // Virtual timers rebind the execution; native background timers have no run owner.
  if (runtimeExecution.getStore()?.closed) {
    return runtimeExecution.run(undefined, callback);
  }

  return callback();
};

export const runtimeSetTimeout: typeof setTimeout = ((callback: () => void, ms: number) => {
  const timers = runtimeScope.getStore()?.timers;

  return timers ? timers.set(scheduledCallback(callback), ms, false) : setTimeout(scheduledCallback(callback), ms);
}) as typeof setTimeout;
export const runtimeSetInterval: typeof setInterval = ((callback: () => void, ms: number) => {
  const timers = runtimeScope.getStore()?.timers;

  return timers ? timers.set(scheduledCallback(callback), ms, true) : setInterval(scheduledCallback(callback), ms);
}) as typeof setInterval;
export const runtimeClearTimeout: typeof clearTimeout = (handle: any) => {
  const timers = runtimeScope.getStore()?.timers;

  if (timers) {
    timers.clear(handle);
  } else {
    clearTimeout(handle);
  }
};
export const runtimeClearInterval: typeof clearInterval = (handle: any) => {
  const timers = runtimeScope.getStore()?.timers;

  if (timers) {
    timers.clear(handle);
  } else {
    clearInterval(handle);
  }
};
