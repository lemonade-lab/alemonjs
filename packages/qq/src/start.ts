import { join, dirname } from 'path'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { getConfig } from 'alemonjs'

/**
 * 递归获取所有文件
 * @param dir
 * @param condition
 * @returns
 */
const getDirFiles = (
  dir,
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
const unMount = mainDir => {
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
const loadChildrenFiles = async mainDir => {
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
const loadModule = async mainPath => {
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
const moduleChildrenFiles = async name => {
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
const start = async (plat: string, input = 'lib/index.js') => {
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
  global.alemonjs = bot?.default()
}

export { getConfig, getDirFiles, start, unMount }
