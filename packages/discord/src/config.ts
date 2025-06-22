import { getConfigValue, useUserHashKey } from 'alemonjs'
import { DISOCRDOptions } from './sdk/wss.types'

// 平台
export const platform = 'discord'

export const getDiscordConfig = (): DISOCRDOptions & {
  [key: string]: any
} => {
  const value = getConfigValue() || {}
  const config = value[platform] || {}
  return config
}

export const getMaster = (UserId: string) => {
  const config = getDiscordConfig()
  const master_key = config.master_key || []
  const master_id = config.master_id || []
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  })
  const is = master_key.includes(UserKey) || master_id.includes(UserId)
  return [is, UserKey]
}
