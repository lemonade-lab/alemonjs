import { BOTCONFIG } from '../config/index.js'
/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ() {
  const config = BOTCONFIG.get('qq')
  if (
    (config ?? '') !== '' &&
    (config.appID ?? '') !== '' &&
    (config.token ?? '') !== ''
  ) {
    BOTCONFIG.set('qq', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'QQ ERR')
  return false
}
