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
 * email
 */
export * from './email/index.js'

/**
 *
 */
export * from './log.js'
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
