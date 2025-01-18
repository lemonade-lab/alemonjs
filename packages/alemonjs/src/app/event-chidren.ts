import { DefineChildren } from '../global'
/**
 * @param callback
 * @returns
 */
export const defineChildren: DefineChildren = callback => {
  return {
    _name: 'apps',
    callback
  }
}
global.defineChildren = defineChildren
