import prompts from 'prompts'
import { setBotConfigByKey, getBotConfigByKey } from '../login.js'
import { getToml, writeToml } from '../config.js'
/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByVilla() {
  // 重写登录
  if (process.argv.indexOf('login') == -1) {
    // 启动
    const config = getBotConfigByKey('villa')
    // 存在
    if ((config ?? '') !== '' && (config.bot_id ?? '') !== '' && (config.secret ?? '') !== '') {
      setBotConfigByKey('villa', config)
      return true
    }
  }
  console.info('[LOGIN]', '-----------------------')
  const timeoutId = setTimeout(() => {
    throw '超过1分钟未完成登录'
  }, 60000)
  const { bot_id, secret } = await prompts([
    {
      type: 'password',
      name: 'bot_id',
      message: 'bot_id: ',
      validate: (value: any) => (value !== '' && typeof value === 'string' ? true : 'bot_id: ')
    },
    {
      type: 'password',
      name: 'secret',
      message: 'secret: ',
      validate: (value: any) => (value !== '' && typeof value === 'string' ? true : 'secret: ')
    }
  ]).catch((err: any) => {
    console.error(err)
    process.exit()
  })
  if (!bot_id || !secret) return false
  clearTimeout(timeoutId)
  // 得到已变更的配置
  const db = getBotConfigByKey('villa')
  // 得到配置
  const data = getToml()
  data.villa = {
    ...db,
    // 覆盖新配置
    bot_id,
    secret
  }
  // 写入配置
  writeToml(data)
  // 设置配置
  setBotConfigByKey('villa', data.villa)
  return true
}
