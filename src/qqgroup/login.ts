import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import prompts from 'prompts'
import { getYaml } from '../config.js'
import { setBotConfigQQGroup } from './config.js'
import { LoginConfigByQQRroup } from './types.js'
import { getBotConfigQQGroup } from './config.js'
import { watchLogin } from '../watch.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobot(Bcf: string) {
  if (!process.argv.includes('login')) {
    const config: LoginConfigByQQRroup = getYaml(join(process.cwd(), Bcf))
    if ((config ?? '') !== '' && (config.account ?? '') !== '' && (config.password ?? '') !== '') {
      setBotConfigQQGroup(config)
      return true
    }
  }

  console.info('[LOGIN]', '-----------------------')

  const timeoutId = setTimeout(() => {
    throw '超过1分钟未完成登录'
  }, 60000)

  const { account, password, masterID, device } = await prompts([
    {
      type: 'password',
      name: 'account',
      message: '机器账号: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器账号: ')
    },
    {
      type: 'password',
      name: 'password',
      message: '机器密码: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器密码: ')
    },
    {
      type: 'password',
      name: 'masterID',
      message: '主人账号: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '主人账号: ')
    },
    {
      type: 'select',
      name: 'device',
      message: '请选择登录设备 :',
      choices: [
        { title: '安卓手机', value: 1 },
        { title: '安卓平板', value: 2 },
        { title: '安卓手表', value: 3 },
        { title: 'MacOS', value: 4 },
        { title: 'iPad', value: 5 },
        { title: 'Tim', value: 6 }
      ],
      initial: 0 // 默认安卓
    }
  ]).catch((err: any) => {
    console.log(err)
    process.exit()
  })

  if (!account || !password || !masterID || !device) {
    return false
  }

  clearTimeout(timeoutId)

  let str = `account: '' # 机器人 账户
password: '' # 机器人 密码
device: '' # 登录设备 
masterID: '' # 主人编号 
masterPW: '' # 主人密码 
friendApplication: false # 好友申请
groupInvitation: false # 邀群申请
addGroupApplication: false # 加群申请
# 签名API地址(如:http://127.0.0.1:8080/sign?key=12315)
sign_api_addr: 
# 传入的QQ版本(如:8.9.63、8.9.68)
version:  `

  str = str
    .replace(/account: ''/g, `account: ${account}`)
    .replace(/password: ''/g, `password: '${password}'`)
    .replace(/masterID: ''/g, `masterID: '${masterID}'`)
    .replace(/device: ''/g, `device: ${device}`)

  /**
   * 确保目录存在
   */
  mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })

  /**
   * 写入内容
   */
  writeFileSync(join(process.cwd(), Bcf), str)

  console.info('[CTRETE]', join(process.cwd(), Bcf))

  watchLogin(join(process.cwd(), Bcf), getBotConfigQQGroup)

  setBotConfigQQGroup({
    account,
    password,
    device
  })
  return true
}
