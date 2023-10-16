if (
  process.argv.slice(2).includes('discord') &&
  !process.argv.slice(2).includes('no')
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
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
 * *************
 * exit
 * *************
 */
process.on('SIGINT', signals => {
  console.info(signals)
  if (process.pid) {
    process.exit()
  }
  return
})
