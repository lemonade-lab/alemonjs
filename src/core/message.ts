// 消息控制
const MSG: {
  [key: string]: (...args: any[]) => any | Promise<any>
} = {}

// 扩展控制
const ARG: {
  [key: string]: (...args: any[]) => any[] | Promise<any[]>
} = {}

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
export function setMessage(
  key: string,
  fnc: (...args: any[]) => any | Promise<any>
) {
  MSG[key] = fnc
}

/**
 * 删除消息
 * @param key 插件名
 */
export function delMessage(key: string) {
  delete MSG[key]
}

/**
 * 得到扩展参数
 * @param key 插件名
 * @returns
 */
export function getAppArg(key: string) {
  return ARG[key]
}

/**
 * 设置扩展参数
 * @param key 插件名
 * @param fnc 方法
 */
export function setAppArg(
  key: string,
  fnc: (...args: any[]) => any[] | Promise<any[]>
) {
  ARG[key] = fnc
}
/**
 * 删除消息
 * @param key 插件名
 */
export function delAppArg(key: string) {
  delete ARG[key]
}
