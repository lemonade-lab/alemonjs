import { ConfigType } from '../typing/types'
type BotType = (_: ConfigType) => typeof global.alemonjs
export const defineBot = (callback: BotType) => callback
