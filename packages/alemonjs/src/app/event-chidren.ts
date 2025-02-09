import { DefineChildren } from '../global'
/**
 * @param callback
 * @returns
 */
export const defineChildren: DefineChildren = callback => {
  // 判断是否是函数
  if (typeof callback !== 'function') {
    throw new Error('Invalid callback: callback must be a function')
  }
  return {
    _name: 'apps',
    callback
  }
}
global.defineChildren = defineChildren
