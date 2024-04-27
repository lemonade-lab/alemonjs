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

if (existsSync(lg_js)) {
  const configLogin = (await readScript(lg_js))?.default
  createBot(configs, configLogin)
} else if (existsSync(lg_ts)) {
  const configLogin = (await readScript(lg_ts))?.default
  createBot(configs, configLogin)
} else {
  createBot(configs)
}

/**
 * *************
 * exit
 * *************
 */
process.on('SIGINT', () => {
  if (process.pid) process.exit()
})
