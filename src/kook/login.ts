import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import prompts from 'prompts'
import { getYaml } from '../config.js'
import { LoginConfigByKOOK } from './types.js'
import { setBotConfigByKOOK, getBotConfigByKOOK } from './config.js'
import { watchLogin } from '../watch.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByKOOK(Bcf: string): Promise<void> {
  /**
   * 读取配置
   */
  if (process.argv.indexOf('login') == -1) {
    const config: LoginConfigByKOOK = getYaml(join(process.cwd(), Bcf))
    if ((config ?? '') !== '' && (config.token ?? '') !== '') {
      setBotConfigByKOOK(config)
      return
    }
  }

  console.info('[LOGIN]', '-----------------------')

  let T = false
  const { token } = await prompts([
    {
      type: 'password',
      name: 'token',
      message: 'BotToken: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 token: ')
    },
    setTimeout(() => {
      if (!T) {
        console.log('超过五分钟未完成登录')
        process.exit()
      }
    }, 30000)
  ]).catch((err: any) => {
    console.log(err)
    process.exit()
  })

  if (!token) process.exit()

  T = true

  let str = `token: '' # 机器人令牌 BotToken
masterID: '' # 主人编号 masterId
password: '' # 主人密码 mastetPassword`

  str = str.replace(/token: ''/g, `token: '${token}'`)

  /**
   * 确保目录存在
   */
  mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })

  /**
   * 写入内容
   */
  writeFileSync(join(process.cwd(), Bcf), str)

  console.info('[CTRETE]', join(process.cwd(), Bcf))

  watchLogin(join(process.cwd(), Bcf), getBotConfigByKOOK)

  /**
   * 设置配置
   */
  setBotConfigByKOOK({
    token,
    masterID: '',
    password: ''
  })
  return
}
