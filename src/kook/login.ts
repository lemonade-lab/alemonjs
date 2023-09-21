import prompts from 'prompts'
import { setBotConfigByKey, getBotConfigByKey } from '../login.js'
import { getToml, writeToml } from '../config.js'

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
  if (process.argv.indexOf('login') == -1) {
    const config = getBotConfigByKey('kook')
    if ((config ?? '') !== '' && (config.token ?? '') !== '') {
      setBotConfigByKey('kook', config)
      return true
    }
  }

  console.info('[LOGIN]', '-----------------------')

  const timeoutId = setTimeout(() => {
    throw '超过1分钟未完成登录'
  }, 60000)
  const { token } = await prompts([
    {
      type: 'password',
      name: 'token',
      message: 'BotToken: ',
      validate: (value: any) =>
        value !== '' && typeof value === 'string' ? true : '机器人 token: '
    }
  ]).catch((err: any) => {
    console.error(err)
    process.exit()
  })

  if (!token) return false

  clearTimeout(timeoutId)

  // 得到已变更的配置
  const db = getBotConfigByKey('kook')
  // 得到配置
  const data = getToml()
  data.kook = {
    ...db,
    // 覆盖新配置
    token
  }
  // 写入配置
  writeToml(data)
  // 设置配置
  setBotConfigByKey('kook', data.kook)
  return true
}
