/**
 * 全部挂在全局变量上，
 * 要求一个nodejs中，
 * 出现不同位置的模块也读取同一个数据
 * @description 存储器
 */
import { SinglyLinkedList } from '../datastructure/SinglyLinkedList';
import { childrenCallbackRes, ChildrenCycle, EventCycleEnum, EventKeys, StoreMiddlewareItem, StoreResponseItem, SubscribeValue } from '../types';
import { mkdirSync } from 'node:fs';
import log4js from 'log4js';
/**
 *
 * @returns
 */
const createLogger = () => {
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
        // storeActionsBus: {},
        // storeMains: [],
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

export class Response {
  get value() {
    // 得到所有 app，得到所有 res
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      return alemonjsCore.storeChildrenApp[key].response;
    });

    return data.flat();
  }
}

export class ResponseRouter {
  get value() {
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      if (!alemonjsCore.storeChildrenApp[key].register) {
        return [];
      }

      return alemonjsCore.storeChildrenApp[key].register?.response?.current ?? [];
    });

    return data.flat();
  }
}

export class MiddlewareRouter {
  get value() {
    // 得到所有 app，得到所有 res
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      if (!alemonjsCore.storeChildrenApp[key].register) {
        return [];
      }

      return alemonjsCore.storeChildrenApp[key].register?.middleware?.current ?? [];
    });

    return data.flat();
  }
}

export class Middleware {
  get value() {
    // 得到所有 app，得到所有 res
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      return alemonjsCore.storeChildrenApp[key].middleware;
    });

    return data.flat();
  }
}

export class SubscribeList<T extends EventKeys> {
  #select: T;
  #chioce: EventCycleEnum;
  constructor(chioce: EventCycleEnum, select: T) {
    this.#select = select;
    this.#chioce = chioce;
    // 如果不存在，则初始化
    if (!alemonjsCore.storeSubscribeList[this.#chioce].has(this.#select)) {
      alemonjsCore.storeSubscribeList[this.#chioce].set(this.#select, new SinglyLinkedList());
    }
  }

  get value() {
    return alemonjsCore.storeSubscribeList[this.#chioce].get(this.#select);
  }
}

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
  pushSycle(data: ChildrenCycle) {
    this.#cycle = data;
  }

  /**
   * 挂载
   */
  on() {
    alemonjsCore.storeChildrenApp[this.#name] = {
      name: this.#name,
      middleware: this.#middleware,
      response: this.#response,
      cycle: this.#cycle,
      register: this.#registerRes
    };
  }

  /**
   * 卸载
   */
  un() {
    // 清理
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete alemonjsCore.storeChildrenApp[this.#name];
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
export const ProcessorEventUserAudoClearMap = new Map();
