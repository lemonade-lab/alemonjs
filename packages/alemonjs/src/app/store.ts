/**
 * 全部挂在全局变量上，
 * 要求一个nodejs中，
 * 出现不同位置的模块也读取同一个数据
 * @description 存储器
 */
import { SinglyLinkedList } from '../datastructure/SinglyLinkedList'
import { ActionsEventEnum, EventCycle, Events, EventsKeyEnum } from '../typings'
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
  #logger = createLogger()

  /**
   * 创建一个 logger，如果未存在全局变量则赋值
   * @returns
   */
  constructor() {
    this.#logger = createLogger()
    // logger.error('error')
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
        storeActionsBus: {},
        // storeMains: [],
        storeSubscribeList: {
          create: {},
          mount: {},
          unmount: {}
        },
        storeMiddleware: [],
        storeResponse: [],
        storeMiddlewareGather: {} as never,
        storeResponseGather: {} as never
      }
    }
    for (const key of EventsKeyEnum) {
      global.alemonjsCore.storeMiddlewareGather[key] = [] as never
    }
    for (const key of EventsKeyEnum) {
      global.alemonjsCore.storeResponseGather[key] = [] as never
    }
  }

  get value() {
    return global.alemonjsCore
  }
}

export class Response {
  get value() {
    return alemonjsCore.storeResponse
  }
}

export class ResponseGather<T extends keyof Events> {
  #select: T

  constructor(select: T) {
    this.#select = select
    if (!alemonjsCore.storeResponseGather[this.#select]) {
      alemonjsCore.storeResponseGather[this.#select] = []
    }
  }

  get value() {
    return alemonjsCore.storeResponseGather[this.#select]
  }
}

export class Middleware {
  get value() {
    return alemonjsCore.storeMiddleware
  }
}

export class MiddlewareGather<T extends keyof Events> {
  #select: T

  constructor(select: T) {
    this.#select = select
    // 如果没有这个属性，就创建一个
    if (!alemonjsCore.storeMiddlewareGather[this.#select]) {
      alemonjsCore.storeMiddlewareGather[this.#select] = []
    }
  }

  get value() {
    return alemonjsCore.storeMiddlewareGather[this.#select]
  }
}

export class SubscribeList<T extends keyof Events> {
  #select: T
  #chioce: EventCycle
  constructor(chioce: EventCycle, select: T) {
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

export class State {
  #name: string = null
  constructor(name: string, defaultValue = true) {
    this.#name = name
    // 不存在，需要初始化
    if (!alemonjsCore.storeState) {
      // 初始化全局状态
      alemonjsCore.storeState = new Proxy({} as Record<string, boolean>, {
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

export class ActionsBus {
  constructor() {
    if (!alemonjsCore.storeActionsBus) {
      alemonjsCore.storeActionsBus = {}
    }
  }

  /**
   *
   * @param ActionsEventEnum
   * @param callback
   */
  subscribe(ActionsEventEnum: ActionsEventEnum, callback: (data?: any) => void) {
    if (!alemonjsCore.storeActionsBus[ActionsEventEnum]) {
      alemonjsCore.storeActionsBus[ActionsEventEnum] = []
    }
    alemonjsCore.storeActionsBus[ActionsEventEnum].push(callback)
  }

  /**
   *
   */
  publish(ActionsEventEnum: ActionsEventEnum, data?: any) {
    if (alemonjsCore.storeActionsBus[ActionsEventEnum]) {
      alemonjsCore.storeActionsBus[ActionsEventEnum].forEach(callback => callback(data))
    }
  }
}
