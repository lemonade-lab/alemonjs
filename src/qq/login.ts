import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { setBotConfigByKey, getBotConfigByKey } from '../config/index.js'
/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ() {
  if (process.argv.indexOf('login') == -1) {
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
  }
  console.info('[LOGIN]', '-----------------------')
  console.info('[LOGIN]', 'qq配置加载失败~')
  process.exit()
}
