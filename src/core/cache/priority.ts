const PRIORITY: {
  [key: string]: number
} = {}

/**
 * 得到插件默认正则
 * @param key 插件名
 * @returns
 */
export function getAppPriority(key: string) {
  return PRIORITY[key]
}

/**
 * 设置插件默认正则
 * @param key 插件名
 * @param val 事件名
 */
export function setAppPriority(key: string, val: number) {
  PRIORITY[key] = val
}

/**
 * 删除插件默认正则
 * @param key 插件名
 */
export function delAppPriority(key: string) {
  delete PRIORITY[key]
}
