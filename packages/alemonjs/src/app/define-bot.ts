import { DefinePlatformFunc } from '../typings'
/**
 * 定义机器人
 * @param callback
 * @returns
 */
export const definePlatform: DefinePlatformFunc = callback => {
  // 判断是否是函数
  if (typeof callback !== 'function') {
    throw new Error('Invalid callback: callback must be a function')
  }
  return {
    _name: 'platform',
    callback
  }
}
global.definePlatform = definePlatform
/**
 * 废弃，请使用 definePlatform
 * @deprecated
 */
export const defineBot = definePlatform
global.defineBot = defineBot
