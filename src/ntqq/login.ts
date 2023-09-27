import prompts from 'prompts'
import { setBotConfigByKey, getBotConfigByKey } from '../login.js'
import { getToml, writeToml } from '../config.js'
import { NtQQEventsEnum } from '../types.js'

/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ() {
  if (process.argv.indexOf('login') == -1) {
    const config = getBotConfigByKey('ntqq')
    if ((config ?? '') !== '' && (config.appID ?? '') !== '' && (config.token ?? '') !== '') {
      if (!config.intents) {
        config.intents = [NtQQEventsEnum.GROUP_AT_MESSAGE_CREATE, NtQQEventsEnum.C2C_MESSAGE_CREATE]
      }
      setBotConfigByKey('ntqq', config)
      return true
    }
  }

  console.info('[LOGIN]', '-----------------------')

  const timeoutId = setTimeout(() => {
    throw '超过1分钟未完成登录'
  }, 60000)

  const { appID, token } = await prompts([
    {
      type: 'password',
      name: 'appID',
      message: 'BotAppID: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 appID: ')
    },
    {
      type: 'password',
      name: 'token',
      message: 'BotToken: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 token: ')
    }
  ]).catch((err: any) => {
    console.error(err)
    process.exit()
  })

  if (!appID || !token) {
    return false
  }

  clearTimeout(timeoutId)
  /**
   * 默认公域机器人
   */
  const intents = [NtQQEventsEnum.GROUP_AT_MESSAGE_CREATE, NtQQEventsEnum.C2C_MESSAGE_CREATE]

  // 得到已变更的配置
  const db = getBotConfigByKey('ntqq')
  // 得到配置
  const data = getToml()
  data.ntqq = {
    ...db,
    // 覆盖新配置
    appID,
    token,
    intents
  }
  // 写入配置
  writeToml(data)
  // 设置配置
  setBotConfigByKey('ntqq', data.ntqq)
  return true
}
