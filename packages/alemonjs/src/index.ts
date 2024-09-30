import { Config, argv } from './config'
import { pushAppsFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getAppsFiles } from './app/event-files'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { buildAndRun } from './start'

/**
 *
 * @param app
 */
const loadChildrenFiles = (app: string) => {
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

// 好处就是，启动成本低。
// 启动的时候，不需要去加载所有的文件。只需要记住，那些文件是需要加载的。
// 等你消息来的时候，我再去加载。
// 运行时。

/**
 *
 * @param app
 */
const runChildren = (mainDir: string) => {
  // src/apps/**/*
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

type BuildOptions = {
  input: string
  ouput?: string
}

type Options = {
  build?: BuildOptions
}

/**
 *
 * @param param0
 * @returns
 */
export async function defineConfig(optoins?: Options) {
  console.log('optoins', optoins)
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

const startDev = async (input: string) => {
  const configDir = 'alemon.config.yaml'
  const cfg = new Config(configDir)
  const skip = argv.includes('--skip')

  console.log('cfg', cfg)

  // login
  if (!cfg.values?.login) {
    throw new Error('login is required')
  }

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

  if (!input || !existsSync(input)) {
    throw new Error('input is required')
  }

  const dir = join(process.cwd(), input)
  // src/apps/**/*
  const mainDir = dirname(dir)
  const app = await import(`file://${dir}`)
  const c = app?.default?.(cfg.values, cfg.value)
  runChildren(mainDir)
  console.log('app', app)
  c?.onCreated?.()

  // prefix
  const prefix = getArgvValue('--prefix') ?? '@alemonjs/'
  if (!skip) {
    const bot = await import(`${prefix}${cfg.values.login}`)
    // 挂在全局
    global.alemonjs = bot?.default(cfg.values, cfg.value)
  }
  await import(`${prefix}${cfg.values.login}`)
}

const build = (input, ouput) => {
  const mainDir = dirname(input)
  buildAndRun(mainDir, ouput)
}

//
if (process.argv.includes('dev')) {
  const input = getArgvValue('--input')
  if (!input || !existsSync(input)) {
    throw new Error('input is required')
  }
  startDev(input)
} else if (process.argv.includes('build')) {
  const input = getArgvValue('--input')
  if (!input) {
    throw new Error('input and ouput is required')
  }
  const ouput = getArgvValue('--ouput') ?? 'lib'
  build(input, ouput)
}
