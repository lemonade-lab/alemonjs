if (
  process.argv.slice(2).includes('discord') &&
  !process.argv.slice(2).includes('not')
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

// 导出编译工具
export { compilationTools, integration } from 'alemon-rollup'

// 导出核心方法
export * from './alemon/index.js'

// 导出执行
export * from './define/index.js'

// 机器配置管理
export * from './config/index.js'

// 监听退出
process.on('SIGINT', signals => {
  console.info(signals)
  if (process.pid) {
    process.exit()
  }
  return
})
