import { DefineChildrenFunc } from '../typings'
/**
 * 定义子事件
 * @param callback
 * @returns
 */
export const defineChildren: DefineChildrenFunc = callback => {
  if (typeof callback === 'function' || typeof callback === 'object') {
    return {
      _name: 'apps',
      callback
    }
  }
  throw new Error('Invalid callback: callback must be a object or function')
}
global.defineChildren = defineChildren
