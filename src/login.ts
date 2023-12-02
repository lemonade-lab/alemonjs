import { AlemonOptions } from './index.js'
/**
 * ***********
 * 登录集成map
 * **********
 */
export interface LoginMap {
  [key: string]: AlemonOptions['login']
}
/**
 * map登录校验
 * @param val 校验值
 * @returns 返回校验所得login配置
 */
export function analysis(val: LoginMap) {
  const argv = [...process.argv]
  const ars = argv.slice(2)
  // 缓存key
  let ket = ''
  for (const item in val) {
    // item 是key  检查有没有 有则直接得到第一个机器人
    if (ars.includes(item)) {
      ket = item
      break
    }
  }
  // 找不到实例
  if (ket == '') {
    /**
     * 找不到实例 取第一个
     */
    for (const item in val) {
      ket = item
      break
    }
    if (ket == '') {
      return {} as AlemonOptions['login']
    }
  }
  // 剔除不存在的
  for (const item in val[ket]) {
    if (!ars.includes(item)) {
      delete val[ket][item]
    }
  }
  console.info('LOAD BOT', ket)
  return val[ket] as AlemonOptions['login']
}

/**
 * 为每个配置增加识别出Regex
 * @param val
 * @param key
 * @returns
 */
export function analysisRegex(
  val: LoginMap,
  key: {
    [key: string]: RegExp
  }
) {
  // 很多个配置
  const argv = [...process.argv]
  const ars = argv.slice(2)
  // 缓存key
  let ket = ''
  for (const item in val) {
    // item 是key  检查有没有 有则直接得到第一个机器人
    if (ars.includes(item)) {
      ket = item
      break
    }
  }
  // 找不到实例
  if (ket == '') {
    /**
     * 找不到实例 取第一个
     */
    for (const item in val) {
      ket = item
      break
    }
  }
  if (ket == '') return /^$/
  if (Object.prototype.hasOwnProperty.call(key, ket)) {
    // 存在
    return key[ket]
  }
  return /^$/
}
