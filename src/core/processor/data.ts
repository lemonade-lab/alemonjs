import { globalKey } from '../global.key.js'
import { Alemon } from './alemon.js'
if (!globalKey('app')) {
  global.alemonjs.app = new Map<string, typeof Alemon.prototype>()
}
export const AppMap = global.alemonjs.app
