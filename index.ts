process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import { createAlemon } from './src/index.js'
/**
 * 控制
 */
const arr: string[] = []
/**
 * 指令合集
 */
const args = process.argv.slice(2)
/**
 * 推送插件启动到最后
 */
args.push('alemon')
for await (const item of args) {
  /**
   * 不能启动相同的机器人
   */
  if (arr.indexOf(item) != -1) {
    /**
     * 启动过了
     */
    continue
  }
  /**
   * 记录
   */
  arr.push(item)
  /**
   * 存在
   */
  if (createAlemon[item]) {
    await createAlemon[item]()
  }
}
/**
 * 监听退出,防止ts-node退出报错
 */
process.on('SIGINT', signals => {
  console.log(signals)
  if (process.pid) {
    process.exit()
  }
  return
})
