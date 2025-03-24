import { join, dirname } from 'path'
import { existsSync, readdirSync } from 'fs'
import { getConfig } from 'alemonjs'

/**
 * 递归获取所有文件
 * @param dir
 * @param condition
 * @returns
 */
const getDirFiles = (
  dir: string,
  condition = item => /^res(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name)
) => {
  //
  let results = []
  if (!existsSync(dir)) return results
  const list = readdirSync(dir, { withFileTypes: true })
  list.forEach(item => {
    const fullPath = join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(getDirFiles(fullPath, condition))
    } else if (item.isFile() && condition(item)) {
      results.push({
        path: fullPath,
        name: item.name
      })
    }
  })
  return results
}

/**
 * 卸载
 * 可读取自身pkg.main
 * @param mainDir
 */
const unMount = (mainDir: string) => {
  const storeMainsIndex = global.storeMains.indexOf(mainDir)
  if (storeMainsIndex != -1) {
    global.storeMains.splice(storeMainsIndex, 1)
  }
  global.storeResponse = global.storeResponse.filter(item => item.source != mainDir)
  global.storeMiddleware = global.storeMiddleware.filter(item => item.source != mainDir)
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
  const moduleApp = await import(`file://${mainPath}`)
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
const moduleChildrenFiles = async (node: string) => {
  const nodeFileDir = require.resolve(node)
  const mainPath = dirname(nodeFileDir)
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
const start = async (input = 'lib/index.js', plat: string) => {
  const cfg = getConfig()
  const platform = plat
  // 没有参数
  if (typeof platform == 'boolean') return
  // module
  if (cfg.value && cfg.value?.apps && Array.isArray(cfg.value.apps)) {
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
  global.alemonjs = bot?.default?.callback()
}

export { getConfig, getDirFiles, start, unMount }
