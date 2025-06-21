import { getConfigValue } from 'alemonjs'
export const platform = 'telegram'
export const getOneBotConfig = () => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}
