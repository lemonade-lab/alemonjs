/**
 * *************
 * core
 * *************
 */
export * from './core/index.js'
/**
 * *************
 * define
 * *************
 */
export * from './define/index.js'
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
export * from './login.js'
/**
 * api
 */
export * from './api.js'
/**
 * *************
 * exit
 * *************
 */
process.on('SIGINT', signals => {
  console.info(signals)
  if (process.pid) process.exit()
  return
})
