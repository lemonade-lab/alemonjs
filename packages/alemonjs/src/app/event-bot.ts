import { DefineBot } from '../typings'
/**
 *
 * @param callback
 * @returns
 */
export const defineBot: DefineBot = callback => {
  // 判断是否是函数
  if (typeof callback !== 'function') {
    throw new Error('Invalid callback: callback must be a function')
  }
  return {
    _name: 'platform',
    callback
  }
}
global.defineBot = defineBot
