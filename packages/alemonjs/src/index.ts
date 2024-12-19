import './logger.js'
import { getConfigValue } from './config'
import { pushAppsFiles, pushMWFiles } from './app/event-processor'
import { getArgvValue } from './config'
import { getDirFiles } from './app/event-files'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'

const cwd = process.cwd()

/**
 * 加载文件
 * @param app
 */
const loadChildrenFiles = (mainDir: string) => {
  const appsDir = join(mainDir, 'apps')
  const appsFiles = getDirFiles(appsDir)
  for (const file of appsFiles) {
    pushAppsFiles({
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    })
  }
  const mwDir = join(mainDir, 'middleware')
  const mwFiles = getDirFiles(mwDir, item => /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name))
  for (const file of mwFiles) {
    pushMWFiles({
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    })
  }
}

/**
 * 模块文件
 * @param app
 */
const moduleChildrenFiles = async (name: string) => {
  // 存在 package
  const packageJson = JSON.parse(
    readFileSync(join(process.cwd(), 'node_modules', name, 'package.json'), 'utf-8')
  )
  // main
  const mainPath = join(process.cwd(), 'node_modules', name, packageJson.main)
  // 不存在 main
  if (!existsSync(mainPath)) {
    return
  }
  // 根据main来识别apps
  const mainDir = dirname(mainPath)
  const obj = await import(`file://${mainPath}`)
  // 加载
  loadChildrenFiles(mainDir)
  // 执行周期
  obj?.default?.()?.onCreated?.()
}

/**
 *
 * @param input
 */
export const onStart = async (input: string = 'lib/index.js') => {
  const value = getConfigValue()
  const skip = process.argv.includes('--skip')
  const login = value?.login
  // login
  if (!login && !skip) {
    return
  }
  // module
  if (value?.apps) {
    if (Array.isArray(value?.apps)) {
      for (const app of value?.apps) {
        moduleChildrenFiles(app)
      }
    }
  }
  //  input
  const run = async () => {
    // 不存在input
    if (!input) {
      return
    }
    // 路径
    const mainPath = join(cwd, input)
    if (!existsSync(mainPath)) {
      return
    }
    // src/apps/**/*
    const mainDir = dirname(mainPath)
    const obj = await import(`file://${mainPath}`)
    //
    loadChildrenFiles(mainDir)
    // 周期
    obj?.default?.()?.onCreated?.()
  }
  await run()
  // prefix
  const platform = getArgvValue('--platform') ?? `@alemonjs/${login}`
  if (!skip) {
    const bot = await import(platform)
    // 挂在全局
    global.alemonjs = bot?.default()
  }
  await import(platform)
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
export * from './utils.js'
