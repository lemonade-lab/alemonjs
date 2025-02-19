import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { DefineChildrenValue } from '../global.js'
import { unMount } from './hook-use-api.js'
import { ErrorModule } from './utils.js'
import { getRecursiveDirFiles } from './utils.js'

/**
 * 加载文件
 * @param app
 */
const loadChildrenFiles = async (mainDir: string) => {
  const appsDir = join(mainDir, 'apps')
  const appsFiles = getRecursiveDirFiles(appsDir)
  for (const file of appsFiles) {
    global.storeResponse.push({
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    })
  }
  const mwDir = join(mainDir, 'middleware')
  const mwFiles = getRecursiveDirFiles(mwDir, item =>
    /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name)
  )
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
export const loadModule = async (mainPath: string) => {
  if (!mainPath || typeof mainPath !== 'string') {
    logger.error('The module path is not correct')
    return
  }
  const mainDir = dirname(mainPath)
  try {
    const moduleApp: {
      default: DefineChildrenValue
    } = await import(`file://${mainPath}`)
    if (!moduleApp.default?._name || moduleApp.default?._name != 'apps') {
      logger.error('The module name is not correct')
      return
    }
    const app = await moduleApp.default.callback()
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
      .catch(async e => {
        unMount(mainDir)
        if (typeof app?.unMounted == 'function') {
          try {
            await app?.unMounted()
          } catch (e) {
            ErrorModule(e)
          }
        }
        ErrorModule(e)
      })
  } catch (e) {
    ErrorModule(e)
  }
}

/**
 * 模块文件
 * @param app
 */
export const moduleChildrenFiles = async (name: string) => {
  if (typeof name !== 'string') {
    logger.error('The module name is not correct')
    return
  }
  const dir = join(process.cwd(), 'node_modules', name)
  const pkgPath = join(dir, 'package.json')
  if (!existsSync(pkgPath)) return
  try {
    // 存在 package
    const packageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    // main
    const mainPath = join(dir, packageJson.main)
    // 不存在 main
    if (!existsSync(mainPath)) return
    // 根据main来识别apps
    await loadModule(mainPath)
  } catch (e) {
    ErrorModule(e)
  }
}
