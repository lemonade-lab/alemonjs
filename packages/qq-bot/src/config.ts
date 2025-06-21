import { getConfigValue } from 'alemonjs'
export const platform = 'qq-bot'
export const getQQBotConfig = () => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}
