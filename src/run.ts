import { existsSync } from 'fs'
import { join } from 'path'
const dir = './index.js'
const { readScript, createBot } = await import(dir)
// 地址
const conig_js = join(process.cwd(), 'alemon.config.js')
const conig_ts = join(process.cwd(), 'alemon.config.ts')
const lg_ts = join(process.cwd(), 'alemon.login.ts')
const lg_js = join(process.cwd(), 'alemon.login.ts')
// 加载
const configs = existsSync(conig_js)
  ? (await readScript(conig_js))?.default
  : (await readScript(conig_ts))?.default
const configLogin = existsSync(lg_js)
  ? (await readScript(lg_js))?.default
  : (await readScript(lg_ts))?.default
// 运行
createBot(configs, configLogin)
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
