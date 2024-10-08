import { mkdirSync } from 'node:fs'
import log4js from 'log4js'
import { getConfig } from './config'

type LogType = string | Error | unknown
declare global {
  var logger: {
    /**
     *痕迹
     * @param arg
     */
    trace(...arg: LogType[]): any
    /**
     *调试
     * @param arg
     */
    debug(...arg: LogType[]): any
    /**
     *信息
     * @param arg
     */
    info(...arg: LogType[]): any
    /**
     *警告
     * @param arg
     */
    warn(...arg: LogType[]): any
    /**
     *错误
     * @param arg
     */
    error(...arg: LogType[]): any
    /**
     *致命
     * @param arg
     */
    fatal(...arg: LogType[]): any
    /**
     *标记
     * @param arg
     */
    mark(...arg: LogType[]): any
  }
}

/**
 * 创建日志
 * @returns
 */
function createLog() {
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
      default: { appenders: ['console'], level: cfg?.value.log?.level ?? 'info' },
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
  const logger = {
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
  return logger
}
mkdirSync('./logs', {
  recursive: true
})
/**
 * 全局变量 logger
 */
global.logger = createLog() as any
