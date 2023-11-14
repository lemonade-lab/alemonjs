import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'
import { NTQQEventsEnum } from './ntqq.js'

/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ() {
  const config = getBotConfigByKey('ntqq')
  if (
    (config ?? '') !== '' &&
    (config.appID ?? '') !== '' &&
    (config.token ?? '') !== ''
  ) {
    if (!config.intents) {
      config.intents = [
        NTQQEventsEnum.GROUP_AT_MESSAGE_CREATE,
        NTQQEventsEnum.C2C_MESSAGE_CREATE
      ]
    }
    setBotConfigByKey('ntqq', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'NTQQ ERR')
  return false
}
