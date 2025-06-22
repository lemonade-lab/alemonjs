import { getConfigValue, useUserHashKey } from 'alemonjs'
export const platform = 'qq-bot'
export const getQQBotConfig = () => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}
export const getMaster = (UserId: string) => {
  const config = getQQBotConfig()
  const master_key = config.master_key || []
  const master_id = config.master_id || []
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  })
  const is = master_key.includes(UserKey) || master_id.includes(UserId)
  return [is, UserKey]
}
