import { commands, storage } from './storage.js'
import { addModules, delModules, disableModules, updateModules } from './modules.js'
import { cloneRepo } from './git.js'
import { sendGetExpansions, sendWebviewGetExpansions } from './send.js'

/**
 *
 */
const restoreExpansions = () => {
  updateModules()
}

/**
 * 禁用扩展
 * @param name
 */
const disableExpansions = (name: string) => {
  disableModules(name)
}

/**
 * 删除扩展
 * @param name
 */
const delExpansions = (name: string) => {
  delModules(name, () => {
    sendGetExpansions(Array.from(storage.values()).map(item => item.package))
  })
}

/**
 * 立即加载扩展
 * @param name
 */
const addExpansions = (name: string) => {
  addModules(name, () => {
    // 加载完毕后，更新扩展列表
    sendGetExpansions(Array.from(storage.values()).map(item => item.package))
  })
}

/**
 * 主动获取扩展列表
 */
const getExpansions = () => {
  if (storage.size === 0) {
    updateModules()
  }
  // 更新模块列表
  sendGetExpansions(Array.from(storage.values()).map(item => item.package))
}

const command = (command: string) => {
  // 找到命令
  const value = commands.find(c => c.command == command)
  if (value) {
    // 执行命令
    value.callback()
  }
}

/**
 *
 * @param data
 * @returns
 */
const webviewPostMessage = (data: any) => {
  if (!storage.has(data.name)) return
  const pkg = storage.get(data.name)
  if (!pkg || !pkg.view) return
  // 执行回调函数。
  pkg.view.__messages.forEach(callback => {
    callback(data.value)
  })
}

const webviewGetExpansions = (data: any) => {
  if (!storage.has(data.name)) return
  // 更新模块列表
  sendWebviewGetExpansions({
    name: data.name,
    value: {
      type: 'get-expansions',
      data: Array.from(storage.values()).map(item => item.package)
    }
  })
}

/**
 *
 * @param data
 */
const gitClone = (data: string) => {
  cloneRepo(data)
}

export const events = {
  /**
   * 扩展
   */
  'restore-expansions': restoreExpansions,
  'disable-expansions': disableExpansions,
  'del-expansions': delExpansions,
  'add-expansions': addExpansions,
  'get-expansions': getExpansions,
  /**
   * 命令
   */
  'command': command,
  /**
   * git
   */
  'git-clone': gitClone,
  /**
   * webview
   */
  'webview-post-message': webviewPostMessage,
  'webview-get-expansions': webviewGetExpansions
}
