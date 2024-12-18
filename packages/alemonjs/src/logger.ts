import { mkdirSync } from 'node:fs'
import log4js from 'log4js'

// Logger 类型定义
interface Logger {
  trace: (...args: any[]) => void
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  fatal: (...args: any[]) => void
  mark: (...args: any[]) => void
}

/**
 * 创建日志
 * @returns {Logger}
 */
const createLog = (): Logger => {
  const logDir = `./logs/${process.env.LOG_NAME ?? ''}`
  console.log('logDir', logDir)
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
global.logger = createLog()
