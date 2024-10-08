import './logger.js'
import { getConfig } from './config'
import { pushAppsFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getAppsFiles } from './app/event-files'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { buildAndRun } from './build/rullup.js'
import { initConfig } from './store.js'

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
  const cfg = getConfig()
  const skip = process.argv.includes('--skip')
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
  const cfg = getConfig()
  const skip = process.argv.includes('--skip')
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

const main = async () => {
  if (process.argv.includes('--alemonjs-dev')) {
    await initConfig()
    // 开发模式
    let input = getArgvValue('--input')
    if (!input) {
      input = 'src/index.ts'
    }
    if (!existsSync(input)) {
      input = 'src/index.js'
    }
    if (!existsSync(input)) {
      throw new Error('src/index.js is required')
    }
    onDev(input)
  } else if (process.argv.includes('--alemonjs-build')) {
    await initConfig()
    // 开发模式
    let input = getArgvValue('--input')
    if (!input) {
      input = 'src/index.ts'
    }
    if (!existsSync(input)) {
      input = 'src/index.js'
    }
    if (!existsSync(input)) {
      throw new Error('src/index.js is required')
    }
    const ouput = getArgvValue('--ouput') ?? 'lib'
    onBuild(input, ouput)
  } else if (process.argv.includes('--alemonjs-start')) {
    // start 模式 没有config 没有ts环境
    let input = getArgvValue('--input')
    if (!input) {
      // 存在lib/index.js
      if (existsSync('lib/index.js')) {
        input = 'lib/index.js'
      }
    }
    // getOptions
    onStart(input)
  }
}

main()

export * from './post.js'
