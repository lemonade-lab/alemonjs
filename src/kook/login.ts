import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByKOOK() {
  /**
   * 读取配置
   */
  const config = getBotConfigByKey('kook')
  if ((config ?? '') !== '' && (config.token ?? '') !== '') {
    setBotConfigByKey('kook', config)
    return true
  }
  console.error('[AlemonJS]', '[LOGIN]', '-----------------------')
  console.error('[AlemonJS]', '[LOGIN]', 'KOOK配置加载失败~')
  return false
}
