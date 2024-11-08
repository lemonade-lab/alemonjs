import { mkdirSync } from 'node:fs'
import log4js from 'log4js'
/**
 * 创建日志
 * @returns
 */
const createLog = () => {
  mkdirSync('./logs', { recursive: true })
  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: `%[[AJS][%d{hh:mm:ss.SSS}][%4.4p]%] %m`
        }
      },
      command: {
        type: 'dateFile',
        filename: 'logs/command',
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
        }
      },
      error: {
        type: 'file',
        filename: 'logs/error.log',
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern: '[%d{hh:mm:ss.SSS}][%4.4p] %m'
        }
      }
    },
    categories: {
      default: { appenders: ['console'], level: 'info' },
      command: { appenders: ['console', 'command'], level: 'warn' },
      error: { appenders: ['console', 'command', 'error'], level: 'error' }
    }
  })
  const defaultLogger = log4js.getLogger('message')
  const commandLogger = log4js.getLogger('command')
  const errorLogger = log4js.getLogger('error')
  /**
   * 调整error日志等级
   */
  return {
    // 不记录级别
    trace() {
      defaultLogger.trace.call(defaultLogger, ...arguments)
    },
    // 不记录级别
    debug() {
      defaultLogger.debug.call(defaultLogger, ...arguments)
    },
    // 记录info级别
    info() {
      defaultLogger.info.call(defaultLogger, ...arguments)
    },
    warn() {
      commandLogger.warn.call(defaultLogger, ...arguments)
    },
    error() {
      errorLogger.error.call(errorLogger, ...arguments)
    },
    fatal() {
      errorLogger.fatal.call(errorLogger, ...arguments)
    },
    mark() {
      errorLogger.mark.call(commandLogger, ...arguments)
    }
  }
}
/**
 * 全局变量 logger
 */
global.logger = createLog()
