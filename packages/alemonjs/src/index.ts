import { Config, argv } from './config'
import { loadFiles, pushAppsFiles } from './app/event-processor'
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
export async function createBot() {
  const configDir = 'alemon.config.yaml'
  const cfg = new Config(configDir)
  const skip = argv.includes('--skip')
  if (!cfg.values?.login) {
    throw new Error('login is required')
  }
  // local
  loadFiles()
  // module
  if (cfg?.value?.apps) {
    if (Array.isArray(cfg?.value?.apps)) {
      for (const app of cfg?.value?.apps) {
        const m = await import(app)
        const c = m?.default()
        if (c?.apps) {
          for (const app of c.apps) {
            pushAppsFiles(app)
          }
        }
      }
    }
  }
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
export * from './typing/typing'
export * from './app/event-processor'

//
export * from './app/event-files'
