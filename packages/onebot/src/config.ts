import { getConfigValue } from 'alemonjs'
export const platform = 'onebot'
export const getOneBotConfig = () => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}
