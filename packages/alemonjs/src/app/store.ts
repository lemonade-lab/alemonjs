/**
 * 全部挂在全局变量上，
 * 要求一个nodejs中，
 * 出现不同位置的模块也读取同一个数据
 * @description 存储器
 */
import { SinglyLinkedList } from './SinglyLinkedList';
import {
  childrenCallbackRes,
  ChildrenCycle,
  EventCycleEnum,
  EventKeys,
  FileTreeNode,
  ResponseRoute,
  StoreMiddlewareItem,
  StoreResponseItem,
  SubscribeValue
} from '../types';
import { mkdirSync } from 'node:fs';
import log4js from 'log4js';
import { disposeExpose } from './expose.js';
import type KoaRouter from 'koa-router';
import { dispatchRuntimeStatusChange } from './lifecycle-callbacks.js';

export type RuntimeAppStatus = 'discovered' | 'loading' | 'ready' | 'failed' | 'disposed';

export type RuntimeAppCapability = {
  event: boolean;
  httpApi: boolean;
  web: boolean;
  schedule: boolean;
  expose: boolean;
};

export type RuntimeAppError = {
  message: string;
  stack?: string;
  time: number;
};

export type RuntimeAppRecord = {
  name: string;
  kind: 'main' | 'plugin';
  enabled: boolean;
  status: RuntimeAppStatus;
  rootDir: string;
  mainPath: string;
  error?: RuntimeAppError;
  capabilities: RuntimeAppCapability;
  createdAt: number;
  updatedAt: number;
};
/**
 *
 * @returns
 */
const createLogger = () => {
  if (process.env.BROWSER_ENV === 'browser') {
    return {
      // 开发调试
      trace: console.trace.bind(console),
      debug: console.debug.bind(console),
      // 日常
      info: console.info.bind(console),
      mark: console.info.bind(console),
      // 警告
      warn: console.warn.bind(console),
      // 错误
      error: console.error.bind(console),
      // 严重
      fatal: console.error.bind(console)
    };
  }
  const logDir = process.env?.LOG_PATH ?? `./logs/${process.env.LOG_NAME ?? ''}`;

  mkdirSync(logDir, { recursive: true });
  // 当环境被设置为 development 时。被视为 trace
  const level = process.env.NODE_ENV === 'development' ? 'trace' : 'info';
  const hideTime = process.env.LOGGER_TIME === 'false' ? true : false;
  const hideLevel = process.env.LOGGER_LEVEL === 'false' ? true : false;
  let pattern = '';

  if (hideTime && hideLevel) {
    pattern = '%m';
  } else if (hideTime && !hideLevel) {
    pattern = '[%p] %m';
  } else if (!hideTime && hideLevel) {
    pattern = '[%d{yyyy-MM-dd hh:mm:ss}] %m';
  } else {
    pattern = '[%d{yyyy-MM-dd hh:mm:ss}][%p] %m';
  }
  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: pattern
        }
      },
      command: {
        type: 'dateFile',
        filename: `${logDir}/command`,
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: pattern
        }
      },
      error: {
        type: 'dateFile',
        filename: `${logDir}/error`,
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: pattern
        }
      }
    },
    categories: {
      default: { appenders: ['console'], level: level },
      command: { appenders: ['console', 'command'], level: 'info' },
      error: { appenders: ['console', 'command', 'error'], level: 'warn' }
    }
  });
  const defaultLogger = log4js.getLogger('default');
  const commandLogger = log4js.getLogger('command');
  const errorLogger = log4js.getLogger('error');

  return {
    // 开发调试
    trace: defaultLogger.trace.bind(defaultLogger),
    debug: defaultLogger.debug.bind(defaultLogger),
    // 日常
    info: commandLogger.info.bind(commandLogger),
    mark: commandLogger.mark.bind(commandLogger),
    // 警告
    warn: errorLogger.warn.bind(errorLogger),
    // 错误
    error: errorLogger.error.bind(errorLogger),
    // 严重
    fatal: errorLogger.fatal.bind(errorLogger)
  };
};

export class Logger {
  #logger = null;

  /**
   * 创建一个 logger，如果未存在全局变量则赋值
   * @returns
   */
  constructor() {
    this.#logger = createLogger();
    // 如果已经存在，就返回内部 logger
    if (!global.logger) {
      global.logger = this.#logger;
    }
  }

  get value() {
    return this.#logger;
  }
}

export class Core {
  constructor() {
    if (!global.alemonjsCore) {
      global.alemonjsCore = {
        storeState: {},
        storeStateSubscribe: {},
        storeSubscribeList: {
          create: new Map<EventKeys, SinglyLinkedList<SubscribeValue>>(),
          mount: new Map<EventKeys, SinglyLinkedList<SubscribeValue>>(),
          unmount: new Map<EventKeys, SinglyLinkedList<SubscribeValue>>()
        },
        storeChildrenApp: {},
        runtimeApps: {},
        runtimeAppKoaRouters: {}
      };
    }
  }

  get value() {
    return global.alemonjsCore;
  }
}

// Store 版本计数器 — ChildrenApp 注册/卸载时递增，用于脏标记缓存
let _storeVersion = 0;

const createEmptyRuntimeCapabilities = (): RuntimeAppCapability => ({
  event: false,
  httpApi: false,
  web: false,
  schedule: false,
  expose: false
});

const logRuntimeAppStatus = (
  level: 'debug' | 'info' | 'warn',
  record: Pick<RuntimeAppRecord, 'name' | 'kind' | 'status' | 'capabilities'> & {
    error?: RuntimeAppError;
  }
) => {
  if (!global.logger?.[level]) {
    return;
  }

  global.logger[level]({
    message: 'runtime app status',
    data: {
      app: record.name,
      kind: record.kind,
      status: record.status,
      capabilities: record.capabilities,
      error: record.error?.message ?? null
    }
  });
};

const normalizeRuntimeAppError = (error?: unknown): RuntimeAppError | undefined => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      time: Date.now()
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown runtime app error',
    time: Date.now()
  };
};

const sameRuntimeAppCapabilities = (left: RuntimeAppCapability, right: RuntimeAppCapability) => {
  return (
    left.event === right.event && left.httpApi === right.httpApi && left.web === right.web && left.schedule === right.schedule && left.expose === right.expose
  );
};

const sameRuntimeAppError = (left?: RuntimeAppError, right?: RuntimeAppError) => {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return left.message === right.message && left.stack === right.stack;
};

const getRuntimeAppStore = (): Record<string, RuntimeAppRecord> => {
  if (!global.alemonjsCore.runtimeApps) {
    global.alemonjsCore.runtimeApps = {};
  }

  return global.alemonjsCore.runtimeApps;
};

const getRuntimeAppKoaRouterStore = (): Record<string, KoaRouter[]> => {
  if (!global.alemonjsCore.runtimeAppKoaRouters) {
    global.alemonjsCore.runtimeAppKoaRouters = {};
  }

  return global.alemonjsCore.runtimeAppKoaRouters;
};

export const registerRuntimeApp = (
  record: Omit<RuntimeAppRecord, 'createdAt' | 'updatedAt' | 'capabilities'> & {
    capabilities?: Partial<RuntimeAppCapability>;
  }
) => {
  const runtimeApps = getRuntimeAppStore();
  const current = runtimeApps[record.name];
  const now = Date.now();
  const nextCapabilities = {
    ...(current?.capabilities ?? createEmptyRuntimeCapabilities()),
    ...(record.capabilities ?? {})
  };

  runtimeApps[record.name] = {
    name: record.name,
    kind: record.kind,
    enabled: record.enabled,
    status: record.status,
    rootDir: record.rootDir,
    mainPath: record.mainPath,
    error: record.error,
    capabilities: nextCapabilities,
    createdAt: current?.createdAt ?? now,
    updatedAt: now
  };

  if (!current || current.status !== record.status) {
    logRuntimeAppStatus(record.status === 'failed' ? 'warn' : 'debug', runtimeApps[record.name]);
  }

  return runtimeApps[record.name];
};

export const updateRuntimeAppStatus = (name: string, status: RuntimeAppStatus, error?: unknown) => {
  const runtimeApps = getRuntimeAppStore();
  const current = runtimeApps[name];

  if (!current) {
    return;
  }

  const normalizedError = normalizeRuntimeAppError(error);
  const previousStatus = current.status;

  if (current.status === status && sameRuntimeAppError(current.error, normalizedError)) {
    return current;
  }

  current.status = status;
  current.updatedAt = Date.now();
  current.error = normalizedError;

  const level = status === 'failed' ? 'warn' : status === 'disposed' ? 'info' : 'debug';

  logRuntimeAppStatus(level, current);
  void dispatchRuntimeStatusChange({
    appName: name,
    previousStatus,
    status,
    error: normalizedError
      ? {
          message: normalizedError.message,
          time: normalizedError.time
        }
      : undefined
  });

  return current;
};

export const updateRuntimeAppCapabilities = (name: string, capabilities: Partial<RuntimeAppCapability>) => {
  const runtimeApps = getRuntimeAppStore();
  const current = runtimeApps[name];

  if (!current) {
    return;
  }

  const nextCapabilities = {
    ...current.capabilities,
    ...capabilities
  };

  if (sameRuntimeAppCapabilities(current.capabilities, nextCapabilities)) {
    return current;
  }

  current.capabilities = nextCapabilities;
  current.updatedAt = Date.now();

  return current;
};

export const setRuntimeAppKoaRouters = (name: string, koaRouters?: KoaRouter | KoaRouter[]) => {
  const koaRouterStore = getRuntimeAppKoaRouterStore();

  if (!koaRouters) {
    delete koaRouterStore[name];

    return [];
  }

  const normalizedRouters = (Array.isArray(koaRouters) ? koaRouters : [koaRouters]).filter(Boolean);

  koaRouterStore[name] = normalizedRouters;

  return normalizedRouters;
};

export const getRuntimeAppKoaRouters = (name: string) => {
  return getRuntimeAppKoaRouterStore()[name] ?? [];
};

export const clearRuntimeAppKoaRouters = (name: string) => {
  const koaRouterStore = getRuntimeAppKoaRouterStore();

  delete koaRouterStore[name];
};

export const listRuntimeAppKoaRouters = () => {
  return Object.entries(getRuntimeAppKoaRouterStore())
    .sort(([left], [right]) => {
      if (left === 'main' && right !== 'main') {
        return -1;
      }
      if (left !== 'main' && right === 'main') {
        return 1;
      }

      return left.localeCompare(right);
    })
    .map(([name, routers]) => ({
      name,
      routers: [...routers]
    }));
};

export const getRuntimeApp = (name: string) => {
  return getRuntimeAppStore()[name];
};

export const toRuntimeAppSnapshot = (item: RuntimeAppRecord) => ({
  ...item,
  capabilities: { ...item.capabilities },
  error: item.error
    ? {
        message: item.error.message,
        time: item.error.time
      }
    : undefined
});

export const listRuntimeApps = () => {
  return Object.values(getRuntimeAppStore())
    .sort((left, right) => {
      if (left.name === 'main' && right.name !== 'main') {
        return -1;
      }
      if (left.name !== 'main' && right.name === 'main') {
        return 1;
      }

      return left.name.localeCompare(right.name);
    })
    .map(toRuntimeAppSnapshot);
};

export const disposeRuntimeApp = (name: string) => {
  clearRuntimeAppKoaRouters(name);

  return updateRuntimeAppStatus(name, 'disposed');
};

export const disposeAllRuntimeApps = () => {
  const runtimeApps = listRuntimeApps();

  runtimeApps.forEach(app => {
    disposeRuntimeApp(app.name);
  });

  return runtimeApps;
};

export const hasRuntimeAppCapability = (name: string, capability: keyof RuntimeAppCapability) => {
  return Boolean(getRuntimeApp(name)?.capabilities?.[capability]);
};

export const bumpStoreVersion = () => {
  _storeVersion++;
};

export class Response {
  #cache: StoreResponseItem[] | null = null;
  #cacheVersion = -1;

  get value() {
    if (this.#cacheVersion === _storeVersion && this.#cache !== null) {
      return this.#cache;
    }
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      return alemonjsCore.storeChildrenApp[key].response;
    });

    this.#cache = data.flat();
    this.#cacheVersion = _storeVersion;

    return this.#cache;
  }
}

/**
 * @deprecated 已被 ResponseTree 替代，保留仅为兼容
 */
export class ResponseMiddleware {
  find(name: string, stateKey: string) {
    if (typeof name !== 'string' || typeof stateKey !== 'string') {
      return [];
    }
    if (!alemonjsCore.storeChildrenApp[name]) {
      return [];
    }
    const app = alemonjsCore.storeChildrenApp[name];

    if (!app.middlewareResponse) {
      return [];
    }
    // 找根据
    const state = stateKey.split(':');
    // 慢慢的去掉最后一个。并识别是否存在对应的 middlewareResponse
    const mr: StoreResponseItem[] = [];

    // main:response 不算
    while (state.length > 1) {
      const key = state.join(':');

      if (app.middlewareResponse[key]) {
        mr.push(app.middlewareResponse[key]);
      }
      state.pop();
    }

    return mr;
  }
}

// ─── 文件树构建 ───────────────────────────────────────────────

function createTreeNode(): FileTreeNode {
  return { files: [], children: new Map() };
}

/**
 * 将扁平的 response 数组 + middlewareResponse 字典按 stateKey 层级组装为树
 */
function buildFileTree(files: StoreResponseItem[], middlewareResponse: { [key: string]: StoreResponseItem } | undefined): FileTreeNode {
  const root = createTreeNode();

  for (const file of files) {
    if (!file.stateKey) {
      root.files.push(file);
      continue;
    }
    const parts = file.stateKey.split(':');
    let node = root;

    for (const part of parts) {
      if (!node.children.has(part)) {
        node.children.set(part, createTreeNode());
      }
      node = node.children.get(part)!;
    }
    node.files.push(file);
  }

  if (middlewareResponse) {
    for (const [key, mw] of Object.entries(middlewareResponse)) {
      const parts = key.split(':');
      let node = root;

      for (const part of parts) {
        if (!node.children.has(part)) {
          node.children.set(part, createTreeNode());
        }
        node = node.children.get(part)!;
      }
      node.middleware = mw;
    }
  }

  return root;
}

/**
 * 合并两棵文件树
 */
function mergeFileTree(target: FileTreeNode, source: FileTreeNode) {
  target.files.push(...source.files);

  if (source.middleware) {
    if (!target.middleware) {
      target.middleware = source.middleware;
    } else {
      console.warn(`[mergeFileTree] middleware conflict at same stateKey, keeping first (${target.middleware.path}), discarding (${source.middleware.path})`);
    }
  }

  for (const [key, child] of source.children) {
    if (target.children.has(key)) {
      mergeFileTree(target.children.get(key), child);
    } else {
      target.children.set(key, child);
    }
  }
}

const attachRouteAppName = (appName: string, routes: ResponseRoute[] = []): ResponseRoute[] => {
  return routes.map(route => ({
    ...route,
    appName,
    children: route.children ? attachRouteAppName(appName, route.children) : route.children
  }));
};

/**
 * 中间件文件树 — 替代扁平 Middleware 数组
 * 复用 buildFileTree / mergeFileTree，无 middlewareResponse（中间件无嵌套中间件概念）
 */
export class MiddlewareTree {
  #cache: FileTreeNode | null = null;
  #cacheVersion = -1;

  get value(): FileTreeNode {
    if (this.#cacheVersion === _storeVersion && this.#cache !== null) {
      return this.#cache;
    }

    const root = createTreeNode();

    for (const appKey of Object.keys(alemonjsCore.storeChildrenApp)) {
      const app = alemonjsCore.storeChildrenApp[appKey];
      const subTree = buildFileTree(app.middleware ?? [], undefined);

      mergeFileTree(root, subTree);
    }

    this.#cache = root;
    this.#cacheVersion = _storeVersion;

    return this.#cache;
  }
}

/**
 * 文件响应体树 — 替代扁平 Response + ResponseMiddleware 的组合
 */
export class ResponseTree {
  #cache: FileTreeNode | null = null;
  #cacheVersion = -1;

  get value(): FileTreeNode {
    if (this.#cacheVersion === _storeVersion && this.#cache !== null) {
      return this.#cache;
    }

    const root = createTreeNode();

    for (const appKey of Object.keys(alemonjsCore.storeChildrenApp)) {
      const app = alemonjsCore.storeChildrenApp[appKey];
      const subTree = buildFileTree(app.response ?? [], app.middlewareResponse);

      mergeFileTree(root, subTree);
    }

    this.#cache = root;
    this.#cacheVersion = _storeVersion;

    return this.#cache;
  }
}

export class ResponseRouter {
  #cache: any[] | null = null;
  #cacheVersion = -1;

  get value() {
    if (this.#cacheVersion === _storeVersion && this.#cache !== null) {
      return this.#cache;
    }
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      if (!alemonjsCore.storeChildrenApp[key].register) {
        return [];
      }
      if (alemonjsCore.storeChildrenApp[key].register?.responseRouter) {
        return attachRouteAppName(key, alemonjsCore.storeChildrenApp[key].register?.responseRouter?.current ?? []);
      }

      if (alemonjsCore.storeChildrenApp[key].register?.response) {
        return attachRouteAppName(key, alemonjsCore.storeChildrenApp[key].register?.response?.current ?? []);
      }

      return [];
    });

    this.#cache = data.flat();
    this.#cacheVersion = _storeVersion;

    return this.#cache;
  }
}

export class MiddlewareRouter {
  #cache: any[] | null = null;
  #cacheVersion = -1;

  get value() {
    if (this.#cacheVersion === _storeVersion && this.#cache !== null) {
      return this.#cache;
    }
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      if (!alemonjsCore.storeChildrenApp[key].register) {
        return [];
      }
      if (alemonjsCore.storeChildrenApp[key].register?.middlewareRouter) {
        return attachRouteAppName(key, alemonjsCore.storeChildrenApp[key].register?.middlewareRouter?.current ?? []);
      }
      if (alemonjsCore.storeChildrenApp[key].register?.middleware) {
        return attachRouteAppName(key, alemonjsCore.storeChildrenApp[key].register?.middleware?.current ?? []);
      }

      return [];
    });

    this.#cache = data.flat();
    this.#cacheVersion = _storeVersion;

    return this.#cache;
  }
}

export class Middleware {
  #cache: StoreMiddlewareItem[] | null = null;
  #cacheVersion = -1;

  get value() {
    if (this.#cacheVersion === _storeVersion && this.#cache !== null) {
      return this.#cache;
    }
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      return alemonjsCore.storeChildrenApp[key].middleware;
    });

    this.#cache = data.flat();
    this.#cacheVersion = _storeVersion;

    return this.#cache;
  }
}

export class SubscribeList<T extends EventKeys> {
  #select: T;
  #choice: EventCycleEnum;
  constructor(choice: EventCycleEnum, select: T) {
    this.#select = select;
    this.#choice = choice;
    // 如果不存在，则初始化
    if (!alemonjsCore.storeSubscribeList[this.#choice].has(this.#select)) {
      alemonjsCore.storeSubscribeList[this.#choice].set(this.#select, new SinglyLinkedList());
    }
  }

  get value() {
    return alemonjsCore.storeSubscribeList[this.#choice].get(this.#select);
  }
}

/**
 * 纯函数版 SubscribeList 访问 — 避免每次创建类实例的 GC 开销
 */
export const getSubscribeList = <T extends EventKeys>(choice: EventCycleEnum, select: T): SinglyLinkedList<SubscribeValue> => {
  if (!alemonjsCore.storeSubscribeList[choice].has(select)) {
    alemonjsCore.storeSubscribeList[choice].set(select, new SinglyLinkedList());
  }

  return alemonjsCore.storeSubscribeList[choice].get(select);
};

export class StateSubscribe {
  #name: string = null;
  constructor(name: string) {
    this.#name = name;
    if (!alemonjsCore.storeStateSubscribe[name]) {
      alemonjsCore.storeStateSubscribe[name] = [];
    }
  }

  on(callback: (value: boolean) => void) {
    alemonjsCore.storeStateSubscribe[this.#name].push(callback);
  }

  un(callback: (value: boolean) => void) {
    alemonjsCore.storeStateSubscribe[this.#name] = alemonjsCore.storeStateSubscribe[this.#name].filter(cb => cb !== callback);
  }

  get value() {
    return alemonjsCore.storeStateSubscribe[this.#name];
  }
}

/**
 * @deprecated 废弃。指令管理可直接配置禁用正则
 */
class StateProxy {
  create(value: Record<string, boolean> = {}) {
    return new Proxy(value, {
      get(target, prop: string) {
        return prop in target ? target[prop] : false;
      },
      set(target, prop: string, value: boolean) {
        target[prop] = value;
        // 通知所有订阅者
        if (alemonjsCore.storeStateSubscribe[prop]) {
          for (const callback of alemonjsCore.storeStateSubscribe[prop]) {
            callback(value);
          }
        }

        return true; // 表示设置成功
      }
    });
  }
}

/**
 * @deprecated 废弃。指令管理可直接配置禁用正则
 */
export class State {
  #name: string = null;
  /**
   *
   * @param name
   * @param defaultValue 默认，允许匹配
   */
  constructor(name: string, defaultValue = true) {
    this.#name = name;
    // 不存在，需要初始化
    if (!alemonjsCore.storeState) {
      // 初始化全局状态
      alemonjsCore.storeState = new StateProxy().create();
    }
    // 如果不存在则设置默认值
    if (!(name in alemonjsCore.storeState)) {
      alemonjsCore.storeState[name] = defaultValue;
    }
  }
  get value() {
    return alemonjsCore.storeState[this.#name];
  }
  set value(value: boolean) {
    alemonjsCore.storeState[this.#name] = value;
  }
}

export class ChildrenApp {
  // 名字
  #name = null;
  // 中间件
  #middleware: StoreMiddlewareItem[] = [];
  // 响应体
  #response: StoreResponseItem[] = [];
  // 响应体下的中间件
  #middlewareResponse: {
    [key: string]: StoreResponseItem;
  } = {};
  // 周期
  #cycle: ChildrenCycle = null;

  // create
  constructor(name = 'main') {
    this.#name = name;
  }

  #registerRes: childrenCallbackRes = {};

  register(config: childrenCallbackRes) {
    this.#registerRes = config;
  }

  /**
   * 推送响应体
   * @param data
   */
  pushResponse(data: StoreResponseItem[]) {
    this.#response = this.#response.concat(data);
  }

  /**
   * 推送响应下的中间件
   */
  pushResponseMiddleware(data: { [key: string]: StoreResponseItem }) {
    this.#middlewareResponse = {
      ...this.#middlewareResponse,
      ...data
    };
  }

  /**
   * 推送中间件
   * @param data
   */
  pushMiddleware(data: StoreMiddlewareItem[]) {
    this.#middleware = this.#middleware.concat(data);
  }

  /**
   * 推送周期
   * @param data
   */
  pushCycle(data: ChildrenCycle) {
    this.#cycle = data;
  }

  /**
   * 挂载
   */
  on() {
    alemonjsCore.storeChildrenApp[this.#name] = {
      name: this.#name,
      middleware: this.#middleware,
      middlewareResponse: this.#middlewareResponse,
      response: this.#response,
      cycle: this.#cycle,
      register: this.#registerRes
    };
    bumpStoreVersion();
  }

  /**
   * 卸载
   */
  un() {
    // 清理 expose 注册
    disposeExpose(this.#name);
    // 清理
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete alemonjsCore.storeChildrenApp[this.#name];
    bumpStoreVersion();
  }

  /**
   * 获取
   */
  get value() {
    if (!alemonjsCore.storeChildrenApp[this.#name]) {
      this.on();
    }

    return alemonjsCore.storeChildrenApp[this.#name];
  }
}

export const getChildrenApp = (name: string) => {
  return alemonjsCore.storeChildrenApp[name] ?? null;
};

export const listChildrenApps = () => {
  return Object.values(alemonjsCore.storeChildrenApp);
};

export const ProcessorEventAutoClearMap = new Map();

export const ProcessorEventUserAutoClearMap = new Map();

// 初始化日志
export const logger = new Logger().value;

// 初始化核心数据
export const core = new Core().value;

// 监听退出
['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
  process?.on?.(sig, () => {
    setImmediate(() => process.exit(0));
  });
});

process?.on?.('exit', code => {
  logger.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
});
