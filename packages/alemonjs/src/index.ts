import './global.js'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { getConfigValue, getArgvValue } from './config'
import { pushResponseFiles, pushMiddlewareFiles } from './app/event-processor'
import { getDirFiles } from './app/event-files'
import { ChildrenCycle } from './global.js'

if (!global.storeMains) {
  global.storeMains = []
}

/**
 * 加载文件
 * @param app
 */
const loadChildrenFiles = (mainDir: string) => {
  const appsDir = join(mainDir, 'apps')
  const appsFiles = getDirFiles(appsDir)
  for (const file of appsFiles) {
    pushResponseFiles({
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    })
  }
  const mwDir = join(mainDir, 'middleware')
  const mwFiles = getDirFiles(mwDir, item => /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name))
  for (const file of mwFiles) {
    pushMiddlewareFiles({
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
  const obj: {
    default: () => ChildrenCycle
  } = await import(`file://${mainPath}`)
  // 执行周期
  obj.default()?.onCreated()
  //
  global.storeMains.push(mainDir)
  // 加载
  loadChildrenFiles(mainDir)
}

/**
 *
 * @param input
 */
export const start = async (input: string = 'lib/index.js') => {
  const value = getConfigValue()
  const skip = process.argv.includes('--skip')
  const login = value?.login
  // login
  if (!login && !skip) return
  // module
  if (value?.apps && Array.isArray(value.apps)) {
    for (const app of value?.apps) {
      moduleChildrenFiles(app)
    }
  }
  //  input
  const run = async () => {
    // 不存在input
    if (!input) return
    // 路径
    const mainPath = join(process.cwd(), input)
    if (!existsSync(mainPath)) return
    // src/apps/**/*
    const mainDir = dirname(mainPath)
    const obj: {
      default: () => ChildrenCycle
    } = await import(`file://${mainPath}`)
    // 执行周期
    obj.default()?.onCreated()
    //
    global.storeMains.push(mainDir)
    //
    loadChildrenFiles(mainDir)
  }
  await run()
  // prefix
  const platform = getArgvValue('--platform') ?? `@alemonjs/${login}`
  if (!skip) {
    const bot = await import(platform)
    // 挂在全局
    global.alemonjs = bot?.default()
    return
  }
  const bot = await import(platform)
  // 挂在全局
  global.alemonjs = bot?.default()
}

export * from './post.js'
