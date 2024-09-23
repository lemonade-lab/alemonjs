import { Config, argv } from './config'
import { loadFiles, pushAppsFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getAppsFiles } from './app/event-files'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
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
 *
 * @param app
 */
const loadChildrenFiles = app => {
  const packageJson = JSON.parse(readFileSync(`node_modules/${app}/package.json`, 'utf-8'))
  const mainPath = join(`node_modules/${app}`, packageJson.main)
  const mainDir = dirname(mainPath)
  const appsDir = join(mainDir, 'apps')
  const files = getAppsFiles(appsDir)
  for (const file of files) {
    const dir = join(process.cwd(), file)
    pushAppsFiles({
      dir: dirname(dir),
      path: dir
    })
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
        // const m = await import(app)
        // const c = m?.default()
        loadChildrenFiles(app)
      }
    }
  }
  // prefix
  const prefix = getArgvValue('--prefix') ?? '@alemonjs/'
  if (!skip) {
    const bot = await import(`${prefix}${cfg.values.login}`)
    // 挂在全局
    global.alemonjs = bot?.default(cfg.values, cfg.value)
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
export * from './typing/config'
export * from './app/event-processor'
export * from './app/event-files'
export * from './app/event-bot'
export * from './app/event-chidren'
