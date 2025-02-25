import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { unMount } from './hook-use-api.js'
import { ErrorModule } from './utils.js'
import { getRecursiveDirFiles } from './utils.js'
import {
  StoreMiddlewareItem,
  StoreResponseItem,
  DefineChildrenValue,
  ChildrenCycle
} from '../typings'

/**
 *
 * @returns
 */
const createChildrenKey = () => {
  // 随机一个key
  const KEY = `${Date.now()}:${Math.random()}`
  // 如果存在。则重新生成
  // 把子应用挂起来
  // if (alemonjsCore.storeChildren[KEY]) {
  //   return createChildrenKey()
  // }
  //
}

/**
 * 加载文件
 * @param app
 */
const loadChildrenFiles = async (mainDir: string) => {
  const appsDir = join(mainDir, 'apps')
  const appsFiles = getRecursiveDirFiles(appsDir)
  const data: StoreResponseItem[] = []
  for (const file of appsFiles) {
    const reesponse = {
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name
    }
    data.push(reesponse)
    alemonjsCore.storeResponse.push(reesponse)
  }
  const mwDir = join(mainDir, 'middleware')
  const mwFiles = getRecursiveDirFiles(mwDir, item =>
    /^mw(\.|\..*\.)(js|ts|jsx|tsx)$/.test(item.name)
  )
  const mwData: StoreMiddlewareItem[] = []
  for (const file of mwFiles) {
    const middleware = {
      source: mainDir,
      dir: dirname(file.path),
      path: file.path,
      name: file.name
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

    // onCreated 创建
    if (typeof app?.onCreated == 'function') {
      try {
        await app?.onCreated()
      } catch (e) {
        ErrorModule(e)
      }
    }

    // 加载
    await loadChildrenFiles(mainDir).then(async res => {
      alemonjsCore.storeMains.push(mainDir)
      // onMounted 完成索引识别
      if (typeof app?.onMounted == 'function') {
        try {
          await app?.onMounted(res)
        } catch (e) {
          ErrorModule(e)
        }
      }
    })
  } catch (e) {
    // 卸载索引
    unMount(mainDir)
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
  if (!existsSync(pkgPath)) {
    logger.error('The package.json does not exist', pkgPath)
    return
  }
  try {
    // 存在 package
    const packageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    // main
    const mainPath = join(dir, packageJson.main)
    // 不存在 main
    if (!existsSync(mainPath)) {
      logger.error('The main file does not exist', mainPath)
      return
    }
    // 根据main来识别apps
    loadModule(mainPath)
  } catch (e) {
    ErrorModule(e)
  }
}
