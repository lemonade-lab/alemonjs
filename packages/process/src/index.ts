import { commands, getPackages, storage } from './storage.js'
import { updateModules } from './modules.js'
import { cloneRepo } from './git.js'
import { sendGetExpansions, sendWebviewOnExpansionsMessage } from './send.js'

/**
 * 立即加载扩展
 * @param name
 */
const addExpansions = (name: string) => {
  updateModules(name)
  // 加载完毕后，更新扩展列表
  sendGetExpansions(getPackages())
}

/**
 * 主动获取扩展列表
 */
const getExpansions = async () => {
  updateModules()
  // 更新模块列表
  sendGetExpansions(getPackages())
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
  updateModules()
  // 更新模块列表
  sendWebviewOnExpansionsMessage({
    name: data.name,
    value: {
      type: 'get-expansions',
      data: getPackages()
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

// 事件
export const events = {
  'add-expansions': addExpansions,
  'get-expansions': getExpansions,
  'command': command,
  'git-clone': gitClone,
  'webview-post-message': webviewPostMessage,
  'webview-get-expansions': webviewGetExpansions
}

export * from './typing.js'
