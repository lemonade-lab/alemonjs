import {
  NtQQEventsEnum,
  setBotConfigByKey,
  getBotConfigByKey
} from '../config/index.js'

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
  console.info('[LOGIN]', '-----------------------')
  console.info('[LOGIN]', 'ntqq配置加载失败~')
  process.exit()
}
