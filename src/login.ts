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
 * @param val
 * @returns
 */
export function analysis(val: LoginMap) {
  const ars = process.argv.slice(2)
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
  console.log('[BOT]', ket)
  return val[ket] as AlemonOptions['login']
}
