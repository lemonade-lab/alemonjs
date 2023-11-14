import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'
/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByOne() {
  const config = getBotConfigByKey('one')
  if (
    (config ?? '') !== '' &&
    (config.url ?? '') !== '' &&
    (config.access_token ?? '') !== ''
  ) {
    setBotConfigByKey('one', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'ONE ERR')
  return false
}
