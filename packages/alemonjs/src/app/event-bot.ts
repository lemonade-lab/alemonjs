import { ConfigType } from '../typing/types'
type BotType = (_: ConfigType, __: any) => typeof global.alemonjs
export const defineBot = (callback: BotType) => callback
