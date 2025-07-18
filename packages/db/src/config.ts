import { getConfigValue } from 'alemonjs'

/**
 * @returns
 */
export const getMysqlConfig = () => {
  const value = getConfigValue() || {}
  return value?.mysql || {}
}

/**
 *
 * @returns
 */
export const getRedisConfig = () => {
  const value = getConfigValue() || {}
  return value?.redis || {}
}

/**
 *
 * @returns
 */
export const getMongoConfig = () => {
  const value = getConfigValue() || {}
  return value?.mongo || {}
}
