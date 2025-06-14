import { getConfigValue } from 'alemonjs'
import { DISOCRDOptions } from './sdk/wss.types'

// 平台
export const platform = 'discord'

export const getDiscordConfigValue = (): DISOCRDOptions & {
  [key: string]: any
} => {
  const value = getConfigValue() || {}
  const config = value[platform] || {}
  return config
}
