if (
  process.argv.slice(2).includes('discord') &&
  !process.argv.slice(2).includes('not')
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
// 导出机器人
export * from './main.js'
// 导出核心方法
export * from './alemon/index.js'
