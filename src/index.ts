if (
  process.argv.slice(2).includes('discord') &&
  !process.argv.slice(2).includes('not')
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
/**
 * *******************
 * 核心处理器&公共方法
 * *******************
 */
export * from './alemon/index.js'
/**
 * *******************
 * 配置解析器
 * *******************
 */
export * from './define/index.js'
/**
 * **********
 * 配置管理器
 * **********
 */
export * from './config/index.js'
/**
 * **********
 * SDK
 * **********
 */
export * from './api.js'
/**
 * *********
 * 监听退出
 * *********
 */
process.on('SIGINT', signals => {
  console.info(signals)
  if (process.pid) {
    process.exit()
  }
  return
})
