import { getConfigValue, useUserHashKey } from 'alemonjs'

export const platform = 'gui'

export const getGUIConfig = () => {
  const value = getConfigValue() || {}
  // 获取配置
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
  return [is, UserKey]
}
