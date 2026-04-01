/**
 * 全部挂在全局变量上，
 * 要求一个nodejs中，
 * 出现不同位置的模块也读取同一个数据
 * @description 存储器
 */
import { SinglyLinkedList } from './SinglyLinkedList';
import { childrenCallbackRes, ChildrenCycle, EventCycleEnum, EventKeys, FileTreeNode, StoreMiddlewareItem, StoreResponseItem, SubscribeValue } from '../types';
import { mkdirSync } from 'node:fs';
import log4js from 'log4js';
import { disposeExpose } from './expose.js';
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
        storeChildrenApp: {}
      };
    }
  }

  get value() {
    return global.alemonjsCore;
  }
}

// Store 版本计数器 — ChildrenApp 注册/卸载时递增，用于脏标记缓存
let _storeVersion = 0;

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
        return alemonjsCore.storeChildrenApp[key].register?.responseRouter?.current ?? [];
      }

      if (alemonjsCore.storeChildrenApp[key].register?.response) {
        return alemonjsCore.storeChildrenApp[key].register?.response?.current ?? [];
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
        return alemonjsCore.storeChildrenApp[key].register?.middlewareRouter?.current ?? [];
      }
      if (alemonjsCore.storeChildrenApp[key].register?.middleware) {
        return alemonjsCore.storeChildrenApp[key].register?.middleware?.current ?? [];
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
