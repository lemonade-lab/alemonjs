if (
  process.argv.slice(2).includes('discord') &&
  !process.argv.slice(2).includes('no')
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
/**
 * *******************
 * 核心处理&公共方法
 * *******************
 */
export * from './alemon/index.js'
/**
 * *******************
 * 初始化
 * *******************
 */
export * from './define/index.js'
/**
 * **********
 * 配置管理
 * **********
 */
export * from './config/index.js'
/**
 * 登录加载器
 */
export * from './login.js'
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
