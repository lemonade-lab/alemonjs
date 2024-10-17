import { mkdirSync } from 'node:fs'
import log4js from 'log4js'
import { getConfig } from './config'
/**
 * 创建日志
 * @returns
 */
const createLog = () => {
  mkdirSync('./logs', { recursive: true })
  const cfg = getConfig()
  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern: `%[[${cfg.package?.name}@${
            cfg.package?.version ?? '4'
          }][%d{hh:mm:ss.SSS}][%4.4p]%] %m`
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
      default: { appenders: ['console'], level: cfg.value?.log?.level ?? 'info' },
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
    trace() {
      defaultLogger.trace.call(defaultLogger, ...arguments)
    },
    debug() {
      defaultLogger.debug.call(defaultLogger, ...arguments)
    },
    info() {
      defaultLogger.info.call(defaultLogger, ...arguments)
    },
    // warn及以上的日志采用error策略
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
