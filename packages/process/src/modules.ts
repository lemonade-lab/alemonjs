import { join } from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { storage } from './storage.js'
import { context } from './context.js'
import { Actions, webView } from './context-pro.js'
import { sendNotification } from './send.js'
const require = createRequire(import.meta.url)
const nodeModulesDir = join(process.cwd(), 'node_modules')
const pkgModulesDir = join(process.cwd(), 'packages')
const cacheDir = join(nodeModulesDir, '.alemonjs')

/**
 * @param name
 * @param callback
 * @returns
 */
export const addModules = (name: string, callback?: Function) => {
  try {
    const pkg = require(`${name}/package`)
    if (!pkg) return
    const gitDir = join(nodeModulesDir, name, '.git')
    if (fs.existsSync(gitDir)) {
      pkg['isGit'] = true
    }
    if (fs.lstatSync(join(nodeModulesDir, name)).isSymbolicLink()) {
      pkg['isLink'] = true
    }
    if (storage.has(name)) return
    // 添加到 storage 中
    storage.set(name, {
      package: pkg,
      desktop: null,
      action: null,
      view: null
    })

    const createDesktop = async () => {
      if (!pkg.exports) return
      // 如果没有 desktop 模块，直接返回。
      if (!pkg.exports['./desktop']) {
        // 执行回调函数
        callback && callback()
        return
      }
      //
      try {
        const desktop = await import(`${name}/desktop`)
        const _name = pkg.name
        const _pkg = storage.get(_name)
        if (!_pkg) return
        _pkg.desktop = desktop
        // 创建 webview
        context.createSidebarWebView = context => {
          const view = new webView(context, _name)
          // 注册webview
          const _pkg = storage.get(_name)
          if (!_pkg) return view
          _pkg.view = view
          return view
        }
        // 创建 action
        context.createAction = context => {
          const action = new Actions(context, _name)
          // 注册行为
          const _pkg = storage.get(_name)
          if (!_pkg) return action
          _pkg.action = action
          return action
        }
        if (desktop.activate) await desktop.activate(context)
        // 执行回调函数
        callback && callback()
      } catch (e) {
        // console.error(e)
      }
    }
    createDesktop()
  } catch (e) {
    if (storage.has(name)) {
      // 已存在的出错，删除
      storage.delete(name)
    }
    sendNotification(`加载package时出错: ${name}`, 'error')
    console.error(e)
  }
}

/**
 * 获取 alemonjs- 和 @alemonjs/ 下的模块
 * @returns
 */
export const updateModules = (name?: string) => {
  if (!fs.existsSync(nodeModulesDir)) return
  // 刷新该模块脚本
  if (name && storage.has(name)) {
    storage.delete(name)
  }
  const _apps: string[] = []
  // 正则条件
  const reg = /^alemonjs-/
  const nodeModules = fs.readdirSync(nodeModulesDir).filter(name => reg.test(name))
  for (const name of nodeModules) {
    const stat = fs.statSync(join(nodeModulesDir, name))
    if (stat.isDirectory()) {
      _apps.push(name)
    }
  }
  const mentionModuleDir = join(nodeModulesDir, '@alemonjs')
  const mentionModules = fs.readdirSync(mentionModuleDir)
  for (const name of mentionModules) {
    const stat = fs.statSync(join(mentionModuleDir, name))
    if (stat.isDirectory()) {
      _apps.push(`@alemonjs/${name}`)
    }
  }
  // 去重
  const apps = Array.from(new Set(_apps))
    .filter(name => typeof name == 'string')
    .filter(name => name.length > 0)
  const keys = Array.from(storage.keys())
  for (const key of keys) {
    if (!apps.includes(key)) {
      storage.delete(key)
    }
  }
  for (const app of apps) {
    addModules(app)
  }
}

// 删除
export const delModules = (name: string, callback?: Function) => {
  // 确保 nodeModulesDir、 pkgModulesDir和cacheDir 都存在时，都删除。
  fs.rmdirSync(join(nodeModulesDir, name), { recursive: true })
  fs.rmdirSync(join(pkgModulesDir, name), { recursive: true })
  fs.rmdirSync(join(cacheDir, name), { recursive: true })
  callback && callback()
}

// 禁用
export const disableModules = (name: string) => {
  // 也就是把 可能在 nodeModulesDir 或 在 pkgModulesDir 下的模块，都移动到 cacheDir 下。
  const _nodeDir = join(nodeModulesDir, name)
  const _pkgDir = join(pkgModulesDir, name)
  const _cacheDir = join(cacheDir, name)
  // cp
  if (fs.existsSync(_nodeDir)) {
    fs.cpSync(_nodeDir, _cacheDir, { recursive: true })
  } else if (fs.existsSync(_pkgDir)) {
    fs.cpSync(_pkgDir, _cacheDir, { recursive: true })
  }
  // rm
  fs.rmdirSync(join(nodeModulesDir, name), { recursive: true })
  fs.rmdirSync(join(pkgModulesDir, name), { recursive: true })
}

// 恢复
export const cloneModules = (name: string, callback?: Function) => {
  // 把依赖都放进 pkgModulesDir 目录下
  const _pkgDir = join(pkgModulesDir, name)
  const _cacheDir = join(cacheDir, name)
  // cp
  fs.cpSync(_cacheDir, _pkgDir, { recursive: true })
  callback && callback()
  // 进行 yarn install 自动安装
}
