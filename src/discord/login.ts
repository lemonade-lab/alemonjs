import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByDISCORD() {
  /**
   * 读取配置
   */
  const config = getBotConfigByKey('discord')
  if ((config ?? '') !== '' && (config.token ?? '') !== '') {
    setBotConfigByKey('kook', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'KOOK ERR')
  return false
}
