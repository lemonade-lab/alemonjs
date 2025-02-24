import { getPackages } from './storage.js'
import { updateModules } from './modules.js'
import { sendGetExpansions } from './send.js'
/**
 *
 * 立即加载扩展
 * @param name
 */
export const addExpansions = (name: string) => {
  updateModules(name)
  // 加载完毕后，更新扩展列表
  sendGetExpansions(getPackages())
}

/**
 * 主动获取扩展列表
 */
export const getExpansions = async () => {
  updateModules()
  // 更新模块列表
  sendGetExpansions(getPackages())
}
