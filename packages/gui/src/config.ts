import { getConfigValue, useUserHashKey } from 'alemonjs'

export type Options = {
  port?: number
  master_key?: string[]
  master_id?: string[]
}

export const platform = 'gui'

export const getGUIConfig = (): Options => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}

export const getMaster = (UserId: string) => {
  const config = getGUIConfig()
  const master_key = config.master_key || []
  const master_id = config.master_id || []
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  })
  const is = master_key.includes(UserKey) || master_id.includes(UserId)
  return [is, UserKey] as const
}
