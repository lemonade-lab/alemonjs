// uodate log
if (
  process.env.NODE_ENV != 'production' &&
  process.env.ALEMONJS_LOG != 'false'
) {
  const fun = () => {
    return `[ALemonJS] [${new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })}]`
  }
  const log = console.log
  global.console.log = (...argv: any[]) => {
    log(fun(), ...argv)
  }
  const info = console.info
  global.console.info = (...argv: any[]) => {
    info(fun(), ...argv)
  }
  const error = console.error
  global.console.error = (...argv: any[]) => {
    error(fun(), ...argv)
  }
  const debug = console.debug
  global.console.debug = (...argv: any[]) => {
    debug(fun(), ...argv)
  }
}
/**
 * *************
 * core-main
 * *************
 */
export * from './core/main.js'
/**
 * *************
 * config system
 * *************
 */
export * from './config/index.js'
/**
 * *************
 * define
 * *************
 */
export * from './define/index.js'
/**
 * **************
 * api-controler-client
 * **************
 */
export * from './api/index.js'
/**
 * koa api
 */
export * from './file/main.js'
/**
 * **********
 * image
 * ************
 */
export * from './image/index.js'
/**
 * email
 */
export * from './email/index.js'
/**
 * *************
 * exit
 * *************
 */
process.on('SIGINT', () => {
  console.info('[SIGINT] EXIT')
  if (process.pid) process.exit()
  return
})
