import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import prompts from 'prompts'
import { getBotConfigByVilla, setBotConfigByVilla } from './config.js'
import { LoginByVillaConfig } from './types.js'
import { getYaml } from '../config.js'
import { watchLogin } from '../watch.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByVilla(Bcf: string) {
  if (process.argv.indexOf('login') == -1) {
    const config: LoginByVillaConfig = getYaml(join(process.cwd(), Bcf))
    if ((config ?? '') !== '' && (config.bot_id ?? '') !== '' && (config.secret ?? '') !== '') {
      setBotConfigByVilla(config)
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
      validate: value => (value !== '' && typeof value === 'string' ? true : 'BotAppID: ')
    },
    {
      type: 'password',
      name: 'secret',
      message: 'secret: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : 'BotSecret: ')
    }
  ]).catch((err: any) => {
    console.error(err)
    process.exit()
  })
  if (!bot_id || !secret) {
    return false
  }
  clearTimeout(timeoutId)
  /**
   * 基础配置模板
   */
  let str = `bot_id: '' # 机器人 账户
secret: '' # 机器人 密码
masterID: '' # 主人 账户
password: '' # 主人 密码
url: '/api/mys/callback' # 回调地址
port: 8080 # 回调接口
size: 999999 # 图片缓存空间
img_url: '/api/mys/img' # 图片请求路径
IMAGE_DIR: '/api/mys/img' # 图片缓存路径`
  /**
   * 替换登录配置
   */
  str = str
    .replace(/bot_id: ''/g, `bot_id: '${bot_id}'`)
    .replace(/secret: ''/g, `secret: '${secret}'`)
  /**
   * 确保目录存在
   */
  mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })
  /**
   * 写入内容
   */
  writeFileSync(join(process.cwd(), Bcf), str)
  console.info('[CTRETE]', join(process.cwd(), Bcf))
  /**
   * 监听配置
   */
  watchLogin(join(process.cwd(), Bcf), getBotConfigByVilla)
  /**
   *  设置配置
   */
  setBotConfigByVilla({
    bot_id,
    secret,
    masterID: '',
    password: ''
  })
  return true
}
