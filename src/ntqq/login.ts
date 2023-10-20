import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'
import { NtQQEventsEnum } from '../default/types.js'

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
        NtQQEventsEnum.GROUP_AT_MESSAGE_CREATE,
        NtQQEventsEnum.C2C_MESSAGE_CREATE
      ]
    }
    setBotConfigByKey('ntqq', config)
    return true
  }
  console.error('[LOGIN]', '-----------------------')
  console.error('[LOGIN]', 'ntqq配置加载失败~')
  return false
}
