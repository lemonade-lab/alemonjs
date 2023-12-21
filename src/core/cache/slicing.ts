const SLICING: {
  [key: string]: {
    str: string
    reg: RegExp
  }[]
} = {}

/**
 * 得到插件默认正则
 * @param key 插件名
 * @returns
 */
export function getAppSlicing(key: string) {
  return SLICING[key]
}

/**
 * @param key 插件名
 * @param val 规则
 */
export function setAppSlicing(
  key: string,
  val: {
    str: string
    reg: RegExp
  }
) {
  if (!Object.prototype.hasOwnProperty.call(SLICING, key)) SLICING[key] = []
  // 重复存在的丢掉
  const find = SLICING[key].find(
    item => `${item.reg}` == `${val.reg}` && item.str == val.str
  )
  if (find) return
  SLICING[key].push(val)
}

/**
 * 删除插件默认正则
 * @param key 插件名
 */
export function delAppSlicing(key: string) {
  delete SLICING[key]
}
