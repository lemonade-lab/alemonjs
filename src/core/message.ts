// 消息控制
const MSG = {}

/**
 * 得到消息
 * @param key 插件名
 * @returns 重定义回调函数
 */
export function getMessage(key: string) {
  return MSG[key]
}
/**
 * 设置消息
 * @param key 插件名
 * @param fnc 方法
 */
export function setMessage(key: string, fnc: (...args: any[]) => any) {
  MSG[key] = fnc
}
/**
 * 删除消息
 * @param key 插件名
 */
export function delMessage(key: string) {
  delete MSG[key]
}
