export * from './buffer.js'
export * from './ip.js'
export * from './screenshot.js'
export * from './puppeteer.js'
class Utils {
  /**
   * 字符串数组转正则
   * [''] => /^$/
   * ['abc'] => /^abc$/
   * ['a','b','c'] => /^(a|b|c)$/
   * @param APP
   * @returns
   */
  arrayToRule(APP: string[]) {
    return APP.length == 0 ? /^$/ : new RegExp(APP.join('|'))
  }
}
export const UTILS = new Utils()
/**
 * 字符串数组转正则
 * [''] => /^$/
 * ['abc'] => /^abc$/
 * ['a','b','c'] => /^(a|b|c)$/
 * @param APP
   @deprecated 已废弃
 * @returns
 */
export const arrayToRule = UTILS.arrayToRule
