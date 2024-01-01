import { BOTCONFIG } from '../config/index.js'
/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ() {
  const config = BOTCONFIG.get('ntqq')
  if (
    (config ?? '') !== '' &&
    (config.appID ?? '') !== '' &&
    (config.token ?? '') !== '' &&
    (config.secret ?? '') !== ''
  ) {
    BOTCONFIG.set('ntqq', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'NTQQ ERR')
  return false
}
