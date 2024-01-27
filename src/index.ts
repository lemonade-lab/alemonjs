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
 * login
 * *************
 */
export * from './login/index.js'
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
