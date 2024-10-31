import './logger.js'
import { getConfig } from './config'
import { pushAppsFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getAppsFiles } from './app/event-files'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'

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
export const onStart = async (input: string = 'lib/index.js') => {
  const cfg = getConfig()
  const skip = process.argv.includes('--skip')
  const login = cfg.value?.login
  // login
  if (!login && !skip) {
    return
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
    if (!input) return
    const dir = join(cwd, input)
    if (!existsSync(dir)) {
      return
    }
    // src/apps/**/*
    const mainDir = dirname(dir)
    const app = await import(`file://${dir}`)
    const c = app?.default?.()
    runChildren(mainDir)
    c?.onCreated?.()
  }
  await run()
  // prefix
  const prefix = getArgvValue('--prefix') ?? '@alemonjs/'
  if (!skip) {
    const bot = await import(`${prefix}${login}`)
    // 挂在全局
    global.alemonjs = bot?.default()
  }
  await import(`${prefix}${login}`)
}

const main = async () => {
  if (process.argv.includes('--alemonjs-start')) {
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
