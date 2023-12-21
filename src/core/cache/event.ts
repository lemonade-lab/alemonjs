const EVENT: {
  [key: string]: 'MESSAGES' | 'message'
} = {}

/**
 * 得到正则默认事件
 * @param key 插件名
 * @returns
 */
export function getAppEvent(key: string) {
  return EVENT[key]
}

/**
 * 设置正则默认事件
 * @param key 插件名
 * @param val 事件名
 */
export function setAppEvent(key: string, val: 'MESSAGES' | 'message') {
  EVENT[key] = val
}
/**
 * 删除正则默认事件
 * @param key 插件名
 */
export function delAppEvent(key: string) {
  delete EVENT[key]
}
