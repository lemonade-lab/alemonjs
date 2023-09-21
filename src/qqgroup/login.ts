import prompts from 'prompts'
import { getBotConfigByKey, setBotConfigByKey } from '../login.js'
import { getToml, writeToml } from 'src/config.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobot() {
  if (!process.argv.includes('login')) {
    // 启动
    const config = getBotConfigByKey('qqgroup')
    if ((config ?? '') !== '' && (config.account ?? '') !== '' && (config.password ?? '') !== '') {
      setBotConfigByKey('qqgroup', config)
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

  // 得到已变更的配置
  const db = getBotConfigByKey('qqgroup')
  // 得到配置
  const data = getToml()
  data.qqgroup = {
    ...db,
    // 覆盖新配置
    account,
    password,
    masterID,
    device
  }
  // 写入配置
  writeToml(data)
  // 设置配置
  setBotConfigByKey('qqgroup', data.qqgroup)
  return true
}
