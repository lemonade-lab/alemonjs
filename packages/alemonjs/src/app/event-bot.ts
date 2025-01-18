import { DefineBot } from '../global'
/**
 *
 * @param callback
 * @returns
 */
export const defineBot: DefineBot = callback => {
  return {
    _name: 'platform',
    callback
  }
}
