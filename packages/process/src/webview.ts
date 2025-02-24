import { commands, getPackages, storage } from './storage.js'
import { updateModules } from './modules.js'
import { gitClone } from './git.js'
import { sendWebviewOnExpansionsMessage } from './send.js'
import { addExpansions, getExpansions } from './expansions.js'
import { command } from './command.js'

/**
 *
 * @param data
 * @returns
 */
export const webviewPostMessage = (data: any) => {
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
