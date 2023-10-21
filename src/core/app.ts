// 插件控制
const APP = {}

/**
 * 得到应用
 * @param key 插件名
 * @returns 得到应用集
 */
export function getApp(key: any): object {
  return APP[key]
}

/**
 * 设置应用
 * @param key   插件名
 * @param value  应用合集
 */
export function setApp(key: any, value: any): void {
  APP[key] = value
  return
}

/**
 * 删除应用
 * @param key 插件名
 */
export function delApp(key: any): void {
  delete APP[key]
  return
}

/**
 * 得到应用
 * @returns 得到指定应用值
 */
export function getAppKey() {
  const arr = []
  for (const key in APP) {
    arr.push(key)
  }
  return arr
}
