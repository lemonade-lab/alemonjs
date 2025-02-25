import { Logger } from './typing/logger/index'
import { mkdirSync } from 'node:fs'
import log4js from 'log4js'

/**
 * 创建初始日志
 * @returns
 */
export const createInitLogger = (): Logger => {
  return {
    trace: console.trace,
    debug: console.debug,
    info: console.info,
    mark: console.info,
    warn: console.warn,
    error: console.error,
    fatal: console.error
  }
}

/**
 * 创建日志
 * @returns {Logger}
 */
export const createLogger = (): Logger => {
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
