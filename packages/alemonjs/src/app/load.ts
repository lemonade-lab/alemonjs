import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { unChildren } from './hook-use-api.js'
import { createEventName, showErrorModule } from './utils.js'
import { getRecursiveDirFiles } from './utils.js'
import {
  StoreMiddlewareItem,
  StoreResponseItem,
  DefineChildrenValue,
  ChildrenCycle
} from '../typings'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const mwReg = /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/
/**
 * 加载文件
 * @param app
 */
const loadChildrenFiles = async (mainDir: string, node: string) => {
  const appsDir = join(mainDir, 'apps')
  const appsFiles = getRecursiveDirFiles(appsDir)
  const data: StoreResponseItem[] = []
  for (const file of appsFiles) {
    const state = createEventName(file.path, node)
    const reesponse = {
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name,
      state,
      node
    }
    data.push(reesponse)
    alemonjsCore.storeResponse.push(reesponse)
  }
  const mwDir = join(mainDir, 'middleware')
  const mwFiles = getRecursiveDirFiles(mwDir, item => mwReg.test(item.name))
  const mwData: StoreMiddlewareItem[] = []
  for (const file of mwFiles) {
    const state = createEventName(file.path, node, 'mw')
    const middleware = {
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name,
      state,
      node
    }
    mwData.push(middleware)
    alemonjsCore.storeMiddleware.push(middleware)
  }
  return {
    response: data,
    middleware: mwData
  }
}

/**
 * 加载模块
 * @param mainPath
 */
export const loadChildren = async (mainPath: string, node: string) => {
  if (!mainPath || typeof mainPath !== 'string') {
    logger.error('The module path is not correct')
    return
  }
  const mainDir = dirname(mainPath)

  const show = (e: any) => {
    showErrorModule(e)
    // 卸载索引
    unChildren(mainDir)
  }

  try {
    const moduleApp: {
      default: DefineChildrenValue
    } = await import(`file://${mainPath}`)

    if (!moduleApp?.default) {
      throw new Error('The Children is not default')
    }
    if (!moduleApp?.default?._name) {
      throw new Error('The Children name is not correct')
    }
    if (moduleApp.default._name !== 'apps') {
      throw new Error('The Children name is not correct')
    }
    if (!moduleApp?.default?.callback) {
      throw new Error('The Children callback is not correct')
    }

    let app: ChildrenCycle = null
    if (typeof moduleApp?.default?.callback !== 'function') {
      app = moduleApp?.default.callback
    } else {
      app = await moduleApp.default.callback()
    }

    const unMounted = async e => {
      show(e)
      try {
        await app?.unMounted(e)
      } catch (e) {
        show(e)
      }
    }

    // onCreated 创建
    if (typeof app?.onCreated == 'function') {
      try {
        await app?.onCreated()
      } catch (e) {
        unMounted(e)
        // 出错了，结束后续的操作。
        return
      }
    }

    // onMounted 加载
    try {
      // 加载
      const res = await loadChildrenFiles(mainDir, node)

      // onMounted 完成索引识别
      if (typeof app?.onMounted == 'function') {
        try {
          await app?.onMounted(res)
        } catch (e) {
          unMounted(e)
          return
        }
      }

      // 记录 main
      alemonjsCore.storeMains.push(mainDir)
    } catch (e) {
      unMounted(e)
    }

    // unMounted 卸载
  } catch (e) {
    show(e)
  }
}

/**
 * 废弃
 * @deprecated
 */
export const loadModule = loadChildren

/**
 * 模块文件
 * @param app
 */
export const loadChildrenFile = async (node: string) => {
  if (typeof node !== 'string') {
    logger.error('The module name is not correct')
    return
  }
  try {
    const mainPath = require.resolve(node)
    // 不存在 main
    if (!existsSync(mainPath)) {
      logger.error('The main file does not exist', mainPath)
      return
    }
    // 根据main来识别apps
    loadChildren(mainPath, node)
  } catch (e) {
    showErrorModule(e)
  }
}

/**
 * 废弃
 * @deprecated
 */
export const moduleChildrenFiles = loadChildrenFile
