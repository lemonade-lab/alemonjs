import { Config, argv } from './config'
import { pushAppsFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getAppsFiles } from './app/event-files'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
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
  ouput: string
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
  const configDir = 'alemon.config.yaml'
  const cfg = new Config(configDir)
  const skip = argv.includes('--skip')
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
  if (optoins?.build) {
    const { input, ouput } = optoins.build
    const mainDir = dirname(input)
    await buildAndRun(mainDir, ouput)
    runChildren(ouput)
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

export * from './config'
export * from './hook/use-api'
export * from './app/event-utlis'
export * from './typing/typing'
export * from './typing/config'
export * from './app/event-processor'
export * from './app/event-files'
export * from './app/event-bot'
export * from './app/event-chidren'
