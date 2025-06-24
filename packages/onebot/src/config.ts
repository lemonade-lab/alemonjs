import { getConfigValue, useUserHashKey } from 'alemonjs'
export const platform = 'onebot'

export type Options = {
  url: string
  token?: string
  reverse_enable?: boolean
  reverse_port: number // 17158
  master_key?: string[]
  master_id?: string[]
}
export const getOneBotConfig = (): Options => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}

export const getMaster = (UserId: string) => {
  const config = getOneBotConfig()
  const master_key = config.master_key || []
  const master_id = config.master_id || []
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  })
  const is = master_key.includes(UserKey) || master_id.includes(UserId)
  return [is, UserKey] as const
}
