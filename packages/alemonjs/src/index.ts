import './main.js'
import { Config, argv } from './config'
import { pushAppsFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getAppsFiles } from './app/event-files'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { buildAndRun } from './build/rullup.js'
import { BuildOptions } from 'esbuild'
import { RollupOptions } from 'rollup'

/**
 * 编译配置
 */
type Options = {
  input: string
  build?: {
    esBuildOptions?: BuildOptions
    rollupOptions?: RollupOptions
  }
}

/**
 *
 * @param param0
 * @returns
 */
export const defineConfig = async (optoins?: Options) => optoins

const cwd = process.cwd()

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
    const dir = join(cwd, file)
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
    pushAppsFiles({
      dir: dirname(file),
      path: file
    })
  }
}

/**
 *
 * @param input
 */
const onDev = async (input: string) => {
  const configDir = 'alemon.config.yaml'
  const cfg = new Config(configDir)
  const skip = argv.includes('--skip')
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
  //  input
  const run = async () => {
    const dir = join(cwd, input)
    // src/apps/**/*
    const mainDir = dirname(dir)
    console.log('mainDir', mainDir)
    const app = await import(`file://${dir}`)
    const c = app?.default?.(cfg.values, cfg.value)
    runChildren(mainDir)
    c?.onCreated?.()
  }
  await run()

  // prefix
  const prefix = getArgvValue('--prefix') ?? '@alemonjs/'
  if (!skip) {
    const bot = await import(`${prefix}${cfg.values.login}`)
    // 挂在全局
    global.alemonjs = bot?.default(cfg.values, cfg.value)
  }
  await import(`${prefix}${cfg.values.login}`)
}

/**
 *
 * @param input
 * @param ouput
 */
const onBuild = (input: string, ouput: string) => {
  const mainDir = dirname(input)
  buildAndRun(mainDir, ouput)
}

/**
 *
 */
const onStart = async (input?: string) => {
  const configDir = 'alemon.config.yaml'
  const cfg = new Config(configDir)
  const skip = argv.includes('--skip')
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

  // input
  const run = async () => {
    if (input) {
      const dir = join(cwd, input)
      // src/apps/**/*
      const mainDir = dirname(dir)
      const app = await import(`file://${dir}`)
      const c = app?.default?.(cfg.values, cfg.value)
      runChildren(mainDir)
      c?.onCreated?.()
    }
  }
  await run()

  // prefix
  const prefix = getArgvValue('--prefix') ?? '@alemonjs/'
  if (!skip) {
    const bot = await import(`${prefix}${cfg.values.login}`)
    // 挂在全局
    global.alemonjs = bot?.default(cfg.values, cfg.value)
  }
  await import(`${prefix}${cfg.values.login}`)
}

let options: Options = null

/**
 *
 */
const initConfig = async () => {
  const files = [
    'alemon.config.ts',
    'alemon.config.js',
    'alemon.config.mjs',
    'alemon.config.cjs',
    'alemon.config.tsx'
  ]
  let configDir = ''
  for (const file of files) {
    if (existsSync(file)) {
      configDir = file
      break
    }
  }
  if (configDir !== '') {
    const v = await import(`file://${configDir}`)
    if (v?.default) {
      options = v.default
    }
  }
}

const main = async () => {
  if (argv.includes('--dev')) {
    await initConfig()
    // 开发模式
    let input = getArgvValue('--input')
    if (!input) {
      if (!options?.input) {
        throw new Error('input is required')
      }
      input = options?.input
    }
    if (!existsSync(input)) {
      throw new Error('input is required')
    }
    onDev(input)
  } else if (argv.includes('--build')) {
    await initConfig()
    // 构建模式
    let input = getArgvValue('--input')
    if (!input) {
      if (!options?.input) {
        throw new Error('input is required')
      }
      input = options?.input
    }
    if (!existsSync(input)) {
      throw new Error('input is required')
    }
    const ouput = getArgvValue('--ouput') ?? 'lib'
    onBuild(input, ouput)
  } else if (argv.includes('--tart')) {
    // start 模式 没有config 没有ts环境
    const input = getArgvValue('--input')
    onStart(input)
  }
}

main()

export * from './config'
export * from './hook/use-api'
export * from './app/event-utlis'
export * from './typing/typing'
export * from './typing/config'
export * from './app/event-processor'
export * from './app/event-files'
export * from './app/event-bot'
export * from './app/event-chidren'
