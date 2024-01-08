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
