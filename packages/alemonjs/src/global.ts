import { ChildrenCycle } from './typing/cycle'
import { OnMiddlewareType, OnResponseType } from './typing/event'
import { ClientAPI } from './typing/global'
import { Logger } from './typing/logger/index'
import {
  StoreMiddleware,
  StoreMiddlewareItem,
  StoreResponse,
  StoreResponseItem
} from './typing/store/res'
import { mkdirSync } from 'node:fs'
import log4js from 'log4js'
import { Subscribe } from './typing/subscribe'
import { Events } from './typing/event/map'

const events: (keyof Events)[] = [
  'message.create',
  'message.update',
  'message.delete',
  'message.reaction.add',
  'message.reaction.remove',
  'private.message.create',
  'private.message.update',
  'private.message.delete',
  'private.friend.add',
  'private.guild.add',
  'channal.create',
  'channal.delete',
  'guild.join',
  'guild.exit',
  'member.add',
  'member.remove'
] as const

declare global {
  /**
   *
   */
  var storeMains: string[]
  /**
   * 核心接口
   */
  var alemonjs: ClientAPI
  /**
   * 链
   */
  var storeSubscribeList: Subscribe
  /**
   * 中间件存储池
   */
  var storeMiddleware: StoreMiddlewareItem[]
  /**
   * 响应存储池
   */
  var storeResponse: StoreResponseItem[]
  /**
   * 集成池
   */
  var storeMiddlewareGather: StoreMiddleware
  /**
   *
   */
  var storeResponseGather: StoreResponse
}

if (!global.storeMains) global.storeMains = []

if (!global.storeSubscribeList) {
  global.storeSubscribeList = {
    create: {},
    mount: {},
    unmount: {}
  }
}

if (!global.storeResponse) global.storeResponse = []
if (!global.storeMiddleware) global.storeMiddleware = []
if (!global.storeMiddlewareGather) {
  global.storeMiddlewareGather = {} as never
  for (const key of events) {
    global.storeMiddlewareGather[key] = [] as never
  }
}
if (!global.storeResponseGather) {
  global.storeResponseGather = {} as never
  for (const key of events) {
    global.storeResponseGather[key] = [] as never
  }
}

declare global {
  /**
   * 处理响应事件
   */
  var OnResponse: OnResponseType
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
   * 打印
   */
  var logger: Logger
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

/**
 * export typing
 */
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
export * from './typing/event/index'
export * from './typing/event/map'
export * from './typing/global/index'
export * from './typing/logger/index'
export * from './typing/message/index'
export * from './typing/store/res'
export * from './typing/subscribe'
