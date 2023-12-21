// 消息控制
const MSG: {
  [key: string]: (...args: any[]) => any | Promise<any>
} = {}

/**
 * 得到消息
 * @param key 插件名
 * @returns 重定义回调函数
 */
export function getAppMessage(key: string) {
  return MSG[key]
}

/**
 * 设置消息
 * @param key 插件名
 * @param fnc 方法
 */
export function setAppMessage(
  key: string,
  fnc: (...args: any[]) => any | Promise<any>
) {
  MSG[key] = fnc
}

/**
 * 删除消息
 * @param key 插件名
 */
export function delAppMessage(key: string) {
  delete MSG[key]
}
