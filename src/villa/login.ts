import { BOTCONFIG } from '../config/index.js'
/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByVilla() {
  // 启动
  const config = BOTCONFIG.get('villa')
  // 存在
  if (
    (config ?? '') !== '' &&
    (config.bot_id ?? '') !== '' &&
    (config.secret ?? '') !== ''
  ) {
    BOTCONFIG.set('villa', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'VILLA ERR')
  return false
}
