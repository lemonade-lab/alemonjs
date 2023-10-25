import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'
/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ() {
  const config = getBotConfigByKey('qq')
  if (
    (config ?? '') !== '' &&
    (config.appID ?? '') !== '' &&
    (config.token ?? '') !== ''
  ) {
    if (!config.intents) {
      config.intents = [
        AvailableIntentsEventsEnum.GUILDS,
        AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
        AvailableIntentsEventsEnum.DIRECT_MESSAGE,
        AvailableIntentsEventsEnum.GUILD_MEMBERS
      ]
    }
    setBotConfigByKey('qq', config)
    return true
  }
  console.error('[AlemonJS]', '[LOGIN]', '-----------------------')
  console.error('[AlemonJS]', '[LOGIN]', 'QQ配置加载失败~')
  return false
}
