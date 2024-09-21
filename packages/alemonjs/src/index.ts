import { join } from 'node:path'
import { Config, argv } from './config'
import { loadFiles } from './app/event-files'
import { getArgvValue } from './config'
type options = {
  // 可监听的配置文件
  configDir?: string
  // 动态加载的配置文件
  moduleDir?: string
  // 也可以在这里配置
  module?: {
    app?: any[]
  }
}
/**
 * 创建机器人
 * @returns
 */
export async function createBot(dir = './alemon.config.js') {
  const c = join(process.cwd(), dir)
  const val: options = (await import(`file://${c}`)).default
  const configDir = val?.configDir || 'alemon.config.yaml'
  const cfg = new Config(configDir)
  const skip = argv.includes('--skip')
  if (!cfg.values?.login) {
    throw new Error('login is required')
  }
  await loadFiles()
  // prefix
  const prefix = getArgvValue('--prefix') ?? '@alemonjs/'
  if (!skip) {
    const { login } = await import(`${prefix}${cfg.values.login}`)
    login(cfg.values)
    return
  }
  await import(`${prefix}${cfg.values.login}`)
}
/**
 * 工程化配置
 * @returns
 */
export function defineConfig(options: options = {}) {
  return options
}
export * from './config'
export * from './hook/use-api'
export * from './app/event-utlis'
export * from './typing'
export * from './app/event-processor'
