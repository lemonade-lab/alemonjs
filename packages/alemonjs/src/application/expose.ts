import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { scopedMap, scopedSet } from '../common/runtime-scope.js';
import { currentAppContext } from './runtime/app-context.js';
import { getCurrentAppName } from './runtime/hook-event-context.js';
import { assertExposeSchema, validateExposeValue, snapshotExposeValue, freezeExposeSnapshot } from './expose-schema.js';
import type {
  ExposeActionMeta,
  ExposeProvideConfig,
  ExposeListItem,
  ExposeWatchEvent,
  ExposeSchemaItem,
  ExposeActionDescription,
  ExposeCallContext,
  ExposeCallOptions,
  ExposeCallResult,
  ExposeErrorCode
} from '../types/expose/index.js';

interface ProviderEntry {
  appName: string;
  active: boolean;
  config: ExposeProvideConfig;
  calls: Set<AbortController>;
}
type WatchCallback = (event: ExposeWatchEvent) => unknown;
interface Watcher {
  callback: WatchCallback;
  owner?: string;
  protocol?: string;
}
const storeExpose = scopedMap<string, Map<string, ProviderEntry>>();
const watchers = scopedSet<Watcher>();

type AppScope = ReturnType<typeof currentAppContext>;
const callContext = new AsyncLocalStorage<{ context: ExposeCallContext; scope: AppScope } | undefined>();
const watchOwner = new AsyncLocalStorage<{ appName?: string; scope: AppScope }>();

function currentCallerApp(): string | undefined {
  const observer = watchOwner.getStore();

  const call = getExposeContext();

  if (call) {
    return call.provider;
  }
  if (!observer) {
    return getCurrentAppName();
  }

  return observer.scope === currentAppContext() ? observer.appName : getCurrentAppName();
}

export class ExposeError extends Error {
  constructor(public readonly code: ExposeErrorCode, message: string) {
    super(message);
    this.name = 'ExposeError';
  }
}

/** Expose 上下文与聊天事件的 next 独立，不伪造平台事件或玩家授权。 */
export function getExposeContext(): ExposeCallContext | undefined {
  const call = callContext.getStore();

  if (!call) {
    return undefined;
  }

  return call.scope === currentAppContext() ? call.context : undefined;
}

function emitWatch(event: ExposeWatchEvent) {
  for (const watcher of watchers) {
    if (watcher.protocol && watcher.protocol !== event.protocol) {
      continue;
    }
    try {
      // 异步监听器拒绝也不能变成未处理异常。
      const result = callContext.run(undefined, () => watchOwner.run({ appName: watcher.owner, scope: currentAppContext() }, () => watcher.callback(event)));

      Promise.resolve(result).catch(() => undefined);
    } catch {
      // 观察者不改变动作结果。
    }
  }
}

function resolveEntry(protocol: string, appName: string, expected?: ProviderEntry): ProviderEntry {
  const providers = storeExpose.get(protocol);
  const entry = providers?.get(appName);

  if ((expected && entry !== expected) || (entry && !entry.active)) {
    throw new ExposeError('STALE_PROVIDER', '[expose] provider handle is no longer active');
  }
  if (!providers) {
    throw new ExposeError('PROTOCOL_NOT_FOUND', `[expose] protocol "${protocol}" not found`);
  }
  if (!entry) {
    throw new ExposeError('PROVIDER_NOT_FOUND', `[expose] provider "${appName}" not found in protocol "${protocol}"`);
  }

  return entry;
}

function describeActions(config: ExposeProvideConfig): Record<string, ExposeActionDescription> {
  const actions: Record<string, ExposeActionDescription> = Object.create(null);

  for (const [name, meta] of Object.entries(config.actions)) {
    const { description, params, returns, inputSchema, outputSchema, effect } = meta;

    actions[name] = structuredClone({
      description,
      ...(params ? { params } : {}),
      ...(returns ? { returns } : {}),
      ...(inputSchema ? { inputSchema } : {}),
      ...(outputSchema ? { outputSchema } : {}),
      ...(effect ? { effect } : {})
    });
  }

  return actions;
}

function retire(entry: ProviderEntry) {
  entry.active = false;
  for (const controller of entry.calls) {
    controller.abort(new ExposeError('STALE_PROVIDER', '[expose] provider was unloaded or replaced'));
  }
  entry.calls.clear();
}

/** 批量验证完成后再注册；外部修改原始契约不会修改运行中的接口。 */
export function registerExpose(appName: string, configs: ExposeProvideConfig[]) {
  const prepared = configs.map(config => {
    if (typeof config.name !== 'string' || !config.name || typeof config.description !== 'string' || !config.actions || typeof config.actions !== 'object') {
      throw new Error('Invalid Expose provider');
    }
    const actions: Record<string, ExposeActionMeta> = Object.create(null);

    for (const [name, original] of Object.entries(config.actions)) {
      if (!original) {
        throw new Error('Invalid Expose action');
      }
      const { handler, authorize, ...metadata } = original;
      const action = { ...structuredClone(metadata), handler, ...(authorize !== undefined ? { authorize } : {}) };

      if (!name || !action || typeof action.handler !== 'function' || typeof action.description !== 'string') {
        throw new Error('Invalid Expose action');
      }
      if ((action.inputSchema !== undefined) !== (action.outputSchema !== undefined)) {
        throw new Error('Expose requires both inputSchema and outputSchema');
      }
      if (action.inputSchema !== undefined) {
        assertExposeSchema(action.inputSchema);
      }
      if (action.outputSchema !== undefined) {
        assertExposeSchema(action.outputSchema);
      }
      if (action.authorize !== undefined && typeof action.authorize !== 'function') {
        throw new Error('Invalid Expose authorization hook');
      }
      if (action.effect !== undefined && !['read', 'write', 'unknown'].includes(action.effect)) {
        throw new Error('Invalid Expose effect');
      }
      actions[name] = action;
    }

    return { ...config, actions };
  });

  // 整批先失效，防止一个协议的取消回调调用同批其他旧协议。
  for (const config of prepared) {
    const previous = storeExpose.get(config.name)?.get(appName);

    if (previous) {
      previous.active = false;
    }
  }
  for (const config of prepared) {
    const protocol = config.name;

    if (!storeExpose.has(protocol)) {
      storeExpose.set(protocol, new Map());
    }
    const providers = storeExpose.get(protocol);
    const previous = providers.get(appName);

    if (previous) {
      retire(previous);
    }
    providers.set(appName, { appName, active: true, config, calls: new Set() });
  }
}

function snapshotValue(value: unknown, code: 'INVALID_INPUT' | 'INVALID_OUTPUT'): unknown {
  try {
    return snapshotExposeValue(value);
  } catch {
    throw new ExposeError(code, '[expose] value must be plain JSON data without accessors');
  }
}

const signalAborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, 'aborted').get;

function normalizeCallOptions(value: unknown): ExposeCallOptions {
  const invalid = () => new ExposeError('INVALID_OPTIONS', '[expose] invalid call options');

  if (!value || typeof value !== 'object' || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw invalid();
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);

  for (const key of Reflect.ownKeys(descriptors)) {
    if (typeof key !== 'string' || !['signal', 'timeoutMs'].includes(key) || !Object.prototype.hasOwnProperty.call(descriptors[key], 'value')) {
      throw invalid();
    }
  }
  const timeoutMs = descriptors.timeoutMs?.value;
  const signal = descriptors.signal?.value;

  if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647)) {
    throw invalid();
  }
  if (signal !== undefined) {
    try {
      signalAborted.call(signal);
    } catch {
      throw invalid();
    }
  }

  return { timeoutMs, signal };
}

interface Execution {
  context: ExposeCallContext;
  controller: AbortController;
  started: boolean;
}
function execution(protocol: string, provider: string, action: string): Execution {
  const parent = getExposeContext();
  const controller = new AbortController();

  return {
    started: false,
    controller,
    context: Object.freeze({
      callId: randomUUID(),
      ...(parent ? { parentCallId: parent.callId } : {}),
      callerApp: currentCallerApp(),
      protocol,
      provider,
      action,
      signal: controller.signal
    })
  };
}

/** 两种调用路径都使用此执行器；旧 invoke 保留同步返回行为。 */
function execute(run: Execution, input: unknown, strict: boolean, expected?: ProviderEntry): any {
  const { context, controller } = run;
  const { protocol, provider, action } = context;
  const entry = resolveEntry(protocol, provider, expected);
  const meta = Object.prototype.hasOwnProperty.call(entry.config.actions, action) ? entry.config.actions[action] : undefined;

  if (!meta) {
    throw new ExposeError('ACTION_NOT_FOUND', `[expose] action "${action}" not found in "${protocol}" of "${provider}"`);
  }
  if (strict && (!meta.inputSchema || !meta.outputSchema)) {
    throw new ExposeError('CONTRACT_REQUIRED', '[expose] action has no structured contract');
  }
  const value = meta.inputSchema ? snapshotValue(input, 'INVALID_INPUT') : input;

  if (meta.inputSchema && validateExposeValue(meta.inputSchema, value)) {
    throw new ExposeError('INVALID_INPUT', '[expose] input does not match schema');
  }
  // 校验、授权和 handler 始终使用同一份稳定快照。

  entry.calls.add(controller);
  const cleanup = () => {
    entry.calls.delete(controller);
    controller.signal.removeEventListener('abort', cleanup);
  };

  controller.signal.addEventListener('abort', cleanup, { once: true });
  const checkActive = () => {
    if (controller.signal.aborted) {
      throw controller.signal.reason;
    }
    resolveEntry(protocol, provider, entry);
  };
  const complete = (result: unknown) => {
    checkActive();
    const data = meta.outputSchema ? snapshotValue(result, 'INVALID_OUTPUT') : result;

    if (meta.outputSchema && validateExposeValue(meta.outputSchema, data)) {
      throw new ExposeError('INVALID_OUTPUT', '[expose] output does not match schema');
    }

    if (meta.effect ? meta.effect !== 'read' : action !== 'read') {
      emitWatch({ name: provider, protocol, action, value });
    }

    return data;
  };
  const perform = (allowed: boolean) => {
    checkActive();
    if (allowed !== true) {
      throw new ExposeError('FORBIDDEN', '[expose] invocation was not authorized');
    }
    run.started = true;
    const result = meta.handler(value, context);

    return result && typeof result.then === 'function' ? Promise.resolve(result).then(complete) : complete(result);
  };

  try {
    const result = callContext.run({ context, scope: currentAppContext() }, () => {
      checkActive();
      const authorizationInput = meta.authorize && meta.inputSchema ? freezeExposeSnapshot(snapshotValue(value, 'INVALID_INPUT')) : value;
      const allowed = meta.authorize ? meta.authorize(authorizationInput, context) : true;

      return allowed && typeof (allowed as Promise<boolean>).then === 'function' ? Promise.resolve(allowed).then(perform) : perform(allowed as boolean);
    });

    if (result && typeof (result as Promise<unknown>).then === 'function') {
      return Promise.resolve(result).finally(cleanup);
    }
    cleanup();

    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

/**
 * register() { return { expose: Expose.create().provide({...}) }; }
 * const client = Expose.create(); client.list(); client.schema();
 * client.invoke(protocol, provider, action, value); // 兼容已有插件
 * await client.call(protocol, provider, action, value); // 结构化工具调用
 */
export class Expose {
  #configs: ExposeProvideConfig[] = [];

  static create() {
    return new Expose();
  }

  provide(config: ExposeProvideConfig) {
    this.#configs.push(config);

    return this;
  }

  /** 保留具体 handler 的输入输出类型；不从任意工具名称断言结果类型。 */
  static action<Input, Output>(action: ExposeActionMeta<Input, Output>): ExposeActionMeta<Input, Output> {
    return action;
  }

  getConfigs() {
    return this.#configs;
  }

  list(protocol?: string): ExposeListItem[] {
    const items: ExposeListItem[] = [];

    for (const [name, providers] of storeExpose) {
      if (protocol !== undefined && name !== protocol) {
        continue;
      }
      for (const entry of providers.values()) {
        items.push({
          name: entry.appName,
          protocol: name,
          description: entry.config.description,
          ...(entry.config.version ? { version: entry.config.version } : {}),
          actions: describeActions(entry.config),
          invoke: (action, value) => execute(execution(name, entry.appName, action), value, false, entry)
        });
      }
    }

    return items;
  }

  invoke(protocol: string, appName: string, action: string, value?: any): any {
    return execute(execution(protocol, appName, action), value, false);
  }

  /** 不自动重试；超时或取消发生在 handler 开始后，业务结果只能标记为 unknown。 */
  async call(protocol: string, provider: string, action: string, input: unknown, options: ExposeCallOptions = {}): Promise<ExposeCallResult> {
    const run = execution(protocol, provider, action);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let externalSignal: AbortSignal | undefined;
    let listening = false;
    const abort = () => run.controller.abort(new ExposeError('ABORTED', '[expose] call was cancelled'));
    let rejectAbort: (() => void) | undefined;

    try {
      const normalized = normalizeCallOptions(options);

      externalSignal = normalized.signal;
      if (externalSignal && signalAborted.call(externalSignal)) {
        abort();
      } else {
        if (externalSignal) {
          EventTarget.prototype.addEventListener.call(externalSignal, 'abort', abort, { once: true });
          listening = true;
        }
      }
      if (run.controller.signal.aborted) {
        throw run.controller.signal.reason;
      }
      if (normalized.timeoutMs !== undefined) {
        timer = setTimeout(() => {
          run.controller.abort(new ExposeError('TIMEOUT', '[expose] call deadline exceeded'));
        }, normalized.timeoutMs);
      }
      const cancelled = new Promise<never>((_, reject) => {
        rejectAbort = () => reject(run.controller.signal.reason);
        run.controller.signal.addEventListener('abort', rejectAbort, { once: true });
      });
      // 将同步异常也纳入 race，确保取消监听创建后的拒绝始终有人处理。
      const operation = new Promise<unknown>((resolve, reject) => {
        try {
          resolve(execute(run, input, true));
        } catch (error) {
          reject(error);
        }
      });
      const data = await Promise.race([operation, cancelled]);

      return { ok: true, callId: run.context.callId, data };
    } catch (error) {
      const code = error instanceof ExposeError ? error.code : 'HANDLER_FAILED';

      return {
        ok: false,
        callId: run.context.callId,
        error: {
          code,
          message: error instanceof ExposeError ? error.message : '[expose] action failed',
          outcome: run.started ? 'unknown' : 'not_started'
        }
      };
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      if (listening) {
        EventTarget.prototype.removeEventListener.call(externalSignal, 'abort', abort);
      }
      if (rejectAbort) {
        run.controller.signal.removeEventListener('abort', rejectAbort);
      }
    }
  }

  schema(): ExposeSchemaItem[] {
    return this.list().map(item => ({
      protocol: item.protocol,
      description: item.description,
      ...(item.version ? { version: item.version } : {}),
      providers: [{ name: item.name }],
      actions: item.actions,
      invoke: 'Expose.create().invoke(protocol, appName, action, value?)'
    }));
  }

  watch(protocolOrCallback: string | WatchCallback, callback?: WatchCallback): () => void {
    const cb = typeof protocolOrCallback === 'function' ? protocolOrCallback : callback;

    if (!cb) {
      throw new Error('[expose] watch(protocol, callback) requires a callback');
    }
    const watcher: Watcher = {
      callback: cb,
      owner: currentCallerApp(),
      ...(typeof protocolOrCallback === 'string' ? { protocol: protocolOrCallback } : {})
    };

    watchers.add(watcher);

    return () => {
      watchers.delete(watcher);
    };
  }
}

export function disposeExpose(appName: string) {
  for (const providers of storeExpose.values()) {
    const entry = providers.get(appName);

    if (entry) {
      entry.active = false;
    }
  }
  for (const [protocol, providers] of storeExpose) {
    const entry = providers.get(appName);

    if (entry) {
      retire(entry);
    }
    providers.delete(appName);
    if (!providers.size) {
      storeExpose.delete(protocol);
    }
  }
  for (const watcher of watchers) {
    if (watcher.owner === appName) {
      watchers.delete(watcher);
    }
  }
}

export function clearAllExpose() {
  for (const providers of storeExpose.values()) {
    for (const entry of providers.values()) {
      entry.active = false;
    }
  }
  for (const providers of storeExpose.values()) {
    for (const entry of providers.values()) {
      retire(entry);
    }
  }
  storeExpose.clear();
  watchers.clear();
}
