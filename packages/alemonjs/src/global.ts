import { ChildrenCycle } from './typing/cycle'
import { OnMiddlewareType, OnObserverType, OnResponseType } from './typing/event'
import { ClientAPI, ClientObserver } from './typing/global'
import { Logger } from './typing/logger/index'
import { StoreMiddlewareItem, StoreResponseItem } from './typing/store/res'
import { mkdirSync } from 'node:fs'
import log4js from 'log4js'

declare global {
  /**
   * 打印
   */
  var logger: Logger
}

declare global {
  /**
   * 处理响应事件
   */
  var OnResponse: OnResponseType
  /**
   * 事件观察着
   */
  var OnObserver: OnObserverType
}

declare global {
  /**
   * 中间件
   */
  var OnMiddleware: OnMiddlewareType
}

declare global {
  /**
   *
   */
  var defineChildren: (callback: () => ChildrenCycle) => any
}

declare global {
  /**
   * 核心接口
   */
  var alemonjs: ClientAPI
  /**
   * 观察者存储池
   */
  var storeObserver: ClientObserver
  /**
   * 中间件存储池
   */
  var storeMiddleware: StoreMiddlewareItem[]
  /**
   * 响应存储池
   */
  var storeResponse: StoreResponseItem[]
  /**
   *
   */
  var storeMains: string[]
}

/**
 * 创建日志
 * @returns {Logger}
 */
const createLogger = (): Logger => {
  const logDir = `./logs/${process.env.LOG_NAME ?? ''}`
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

/**
 * 全局变量 logger
 */
global.logger = createLogger()

export * from './typing/cycle/index'
export * from './typing/event/base/guild'
export * from './typing/event/base/message'
export * from './typing/event/base/platform'
export * from './typing/event/base/user'
export * from './typing/event/channal/index'
export * from './typing/event/guild/index'
export * from './typing/event/member/index'
export * from './typing/event/message/message'
export * from './typing/event/message/private.message'
export * from './typing/event/request/index'
export * from './typing/global/index'
export * from './typing/logger/index'
export * from './typing/message/index'
export * from './typing/store/res'
