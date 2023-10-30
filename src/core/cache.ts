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

// 扩展控制
const ARG: {
  [key: string]: (...args: any[]) => any[] | Promise<any[]>
} = {}

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

const CAT: {
  [key: string]: '/' | '#'
} = {}

/**
 * 得到指令规则
 * @param key 插件名
 * @returns
 */
export function getAppCharacter(key: string) {
  return CAT[key]
}

/**
 * 设置令规则
 * @param key 插件名
 * @param val 字符
 */
export function setAppCharacter(key: string, val: '/' | '#') {
  CAT[key] = val
}
/**
 * 删除令规则
 * @param key 插件名
 */
export function delAppCharacter(key: string) {
  delete CAT[key]
}

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
