import { BOTCONFIG } from '../config/index.js'

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
  const config = BOTCONFIG.get('kook')
  if ((config ?? '') !== '' && (config.token ?? '') !== '') {
    BOTCONFIG.set('kook', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'KOOK ERR')
  return false
}
