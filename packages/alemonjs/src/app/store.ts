/**
 * 全部挂在全局变量上，
 * 要求一个nodejs中，
 * 出现不同位置的模块也读取同一个数据
 * @description 存储器
 */
import { SinglyLinkedList } from '../datastructure/SinglyLinkedList'
// import { ActionsEventEnum, EventCycleEnum, EventKeys, Events } from '../typings'
import {
  ChildrenCycle,
  EventCycleEnum,
  EventKeys,
  StoreMiddlewareItem,
  StoreResponseItem
} from '../typings'
import { mkdirSync } from 'node:fs'
import log4js from 'log4js'

/**
 *
 * @returns
 */
const createLogger = () => {
  const logDir = process.env?.LOG_PATH ?? `./logs/${process.env.LOG_NAME ?? ''}`
  mkdirSync(logDir, { recursive: true })
  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: `%[[%d{yyyy-MM-dd hh:mm:ss}][%5.5p]%] %m`
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
          pattern: `%[[%d{yyyy-MM-dd hh:mm:ss}][%5.5p]%] %m`
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
          pattern: `%[[%d{yyyy-MM-dd hh:mm:ss}][%5.5p]%] %m`
        }
      }
    },
    categories: {
      default: { appenders: ['console'], level: 'error' },
      // 记录级别
      command: { appenders: ['console', 'command'], level: 'info' },
      error: { appenders: ['console', 'command', 'error'], level: 'warn' }
    }
  })
  const defaultLogger = log4js.getLogger('message')
  const commandLogger = log4js.getLogger('command')
  const errorLogger = log4js.getLogger('error')
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
  }
}

export class Logger {
  #logger = null

  /**
   * 创建一个 logger，如果未存在全局变量则赋值
   * @returns
   */
  constructor() {
    this.#logger = createLogger()
    // 如果已经存在，就返回内部 logger
    if (!global.logger) {
      global.logger = this.#logger
    }
  }

  get value() {
    return this.#logger
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
          create: {},
          mount: {},
          unmount: {}
        },
        storeChildrenApp: {}
      }
    }
  }

  get value() {
    return global.alemonjsCore
  }
}

export class Response {
  get value() {
    // 得到所有 app，得到所有 res
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      return alemonjsCore.storeChildrenApp[key].response
    })
    return data.flat()
  }
}

export class Middleware {
  get value() {
    // 得到所有 app，得到所有 res
    const data = Object.keys(alemonjsCore.storeChildrenApp).map(key => {
      return alemonjsCore.storeChildrenApp[key].middleware
    })
    return data.flat()
  }
}

export class SubscribeList<T extends EventKeys> {
  #select: T
  #chioce: EventCycleEnum
  constructor(chioce: EventCycleEnum, select: T) {
    this.#select = select
    this.#chioce = chioce
    if (!alemonjsCore.storeSubscribeList[this.#chioce][this.#select]) {
      alemonjsCore.storeSubscribeList[this.#chioce][this.#select] = new SinglyLinkedList()
    }
  }

  get value() {
    return alemonjsCore.storeSubscribeList[this.#chioce][this.#select]
  }
}

export class StateSubscribe {
  #name: string = null
  constructor(name: string) {
    this.#name = name
    if (!alemonjsCore.storeStateSubscribe[name]) {
      alemonjsCore.storeStateSubscribe[name] = []
    }
  }

  on(callback: (value: boolean) => void) {
    alemonjsCore.storeStateSubscribe[this.#name].push(callback)
  }

  un(callback: (value: boolean) => void) {
    alemonjsCore.storeStateSubscribe[this.#name] = alemonjsCore.storeStateSubscribe[
      this.#name
    ].filter(cb => cb !== callback)
  }

  get value() {
    return alemonjsCore.storeStateSubscribe[this.#name]
  }
}

class StateProxy {
  create(value: Record<string, boolean> = {}) {
    return new Proxy(value, {
      get(target, prop: string) {
        return prop in target ? target[prop] : false
      },
      set(target, prop: string, value: boolean) {
        target[prop] = value
        // 通知所有订阅者
        if (alemonjsCore.storeStateSubscribe[prop]) {
          for (const callback of alemonjsCore.storeStateSubscribe[prop]) {
            callback(value)
          }
        }
        return true // 表示设置成功
      }
    })
  }
}

export class State {
  #name: string = null
  /**
   *
   * @param name
   * @param defaultValue 默认，允许匹配
   */
  constructor(name: string, defaultValue = true) {
    this.#name = name
    // 不存在，需要初始化
    if (!alemonjsCore.storeState) {
      // 初始化全局状态
      alemonjsCore.storeState = new StateProxy().create()
    }
    // 如果不存在则设置默认值
    if (!(name in alemonjsCore.storeState)) {
      alemonjsCore.storeState[name] = defaultValue
    }
  }
  get value() {
    return alemonjsCore.storeState[this.#name]
  }
  set value(value: boolean) {
    alemonjsCore.storeState[this.#name] = value
  }
}

export class ChildrenApp {
  // 名字
  #name = null
  // 中间件
  #middleware: StoreMiddlewareItem[] = []
  // 响应体
  #response: StoreResponseItem[] = []
  // 周期
  #cycle: ChildrenCycle = null

  // create
  constructor(name: string = 'main') {
    this.#name = name
  }

  /**
   * 推送响应体
   * @param data
   */
  pushResponse(data: StoreResponseItem[]) {
    this.#response = this.#response.concat(data)
  }

  /**
   * 推送中间件
   * @param data
   */
  pushMiddleware(data: StoreMiddlewareItem[]) {
    this.#middleware = this.#middleware.concat(data)
  }

  /**
   * 推送周期
   * @param data
   */
  pushSycle(data: ChildrenCycle) {
    this.#cycle = data
  }

  /**
   * 挂载
   */
  on() {
    alemonjsCore.storeChildrenApp[this.#name] = {
      name: this.#name,
      middleware: this.#middleware,
      response: this.#response,
      cycle: this.#cycle
    }
  }

  /**
   * 卸载
   */
  un() {
    // 清理
    delete alemonjsCore.storeChildrenApp[this.#name]
  }

  /**
   * 获取
   */
  get value() {
    if (!alemonjsCore.storeChildrenApp[this.#name]) {
      this.on()
    }
    return alemonjsCore.storeChildrenApp[this.#name]
  }
}
