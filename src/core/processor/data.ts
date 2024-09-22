import { Alemon } from './alemon.js'

if (!global?.alemonjs) global.alemonjs = {}
if (!global.alemonjs.app)
  global.alemonjs.app = new Map<string, typeof Alemon.prototype>()

export const AppMap = global.alemonjs.app
