import './global.js'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { getConfig } from './config'
import { getDirFiles } from './app/event-files'
import { ChildrenCycle } from './global.js'

/**
 * 卸载
 * 可读取自身pkg.main
 * @param mainDir
 */
export const unMount = (mainDir: string) => {
  const storeMainsIndex = global.storeMains.indexOf(mainDir)
  if (storeMainsIndex != -1) {
    global.storeMains.splice(storeMainsIndex, 1)
  }
  global.storeResponse = global.storeResponse.filter(item => item.source != mainDir)
  global.storeMiddleware = global.storeMiddleware.filter(item => item.source != mainDir)
  for (const key in global.storeResponseGather) {
    if (Array.isArray(global.storeResponseGather[key])) {
      global.storeResponseGather[key] = global.storeResponseGather[key].filter(
        item => item.source != mainDir
      )
    }
  }
  for (const key in global.storeMiddlewareGather) {
    if (Array.isArray(global.storeMiddlewareGather[key])) {
      global.storeMiddlewareGather[key] = global.storeMiddlewareGather[key].filter(
        item => item.source != mainDir
      )
    }
  }
}

/**
 * 加载文件
 * @param app
 */
const loadChildrenFiles = async (mainDir: string) => {
  const appsDir = join(mainDir, 'apps')
  const appsFiles = getDirFiles(appsDir)
  for (const file of appsFiles) {
    global.storeResponse.push({
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    })
  }
  const mwDir = join(mainDir, 'middleware')
  const mwFiles = getDirFiles(mwDir, item => /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name))
  for (const file of mwFiles) {
    global.storeMiddleware.push({
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    })
  }
  return
}

/**
 *
 * @param mainPath
 */
const loadModule = async (mainPath: string) => {
  const mainDir = dirname(mainPath)
  const moduleApp: {
    default: () => ChildrenCycle
  } = await import(`file://${mainPath}`)
  try {
    const app = await moduleApp.default()
    if (typeof app?.onCreated == 'function') {
      await app?.onCreated()
    }
    // 加载
    loadChildrenFiles(mainDir)
      .then(async () => {
        global.storeMains.push(mainDir)
        if (typeof app?.onMounted == 'function') {
          await app?.onMounted()
        }
      })
      .catch(async () => {
        unMount(mainDir)
        if (typeof app?.unMounted == 'function') {
          await app?.unMounted()
        }
      })
  } catch (e) {
    console.log(e)
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
  await loadModule(mainPath)
}

/**
 *
 * @param input
 */
export const start = async (input: string = 'lib/index.js') => {
  const cfg = getConfig()
  const login = cfg.argv?.login
  if (typeof login == 'boolean') return
  const platform = cfg.argv?.platform ?? `@alemonjs/${login}`
  // 没有参数
  if (typeof platform == 'boolean') return
  // module
  if (cfg.value?.apps && Array.isArray(cfg.value.apps)) {
    for (const app of cfg.value?.apps) {
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
    await loadModule(mainPath)
  }
  await run()
  const bot = await import(platform)
  // 挂在全局
  global.alemonjs = bot?.default()
}

export * from './post.js'
