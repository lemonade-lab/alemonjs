import { dirname, join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import prompts from 'prompts'
import { green, red, yellow } from 'kolorist'

/* 非依赖引入 */
import { readYaml } from './tool'
import { Bcf, Dcf } from '../config'

declare global {
  var cfg: {
    appID: string
    token: string
    intents?: []
    sandbox?: boolean
  }
}

export async function check(): Promise<any> {
  const file = join(process.cwd(), Bcf)
  const config = readYaml(file)
  /* 检查配置 */
  if (
    (config ?? '') !== '' &&
    (config.account ?? '') !== '' &&
    (config.account.appID ?? '') !== '' &&
    (config.account.token ?? '') !== ''
  ) {
    /* 转为全局变量 */
    global.cfg = config.account
  } else {
    /* 开始写入配置 */
    console.log(yellow('请主人按[提示]输入配置信息'))
    console.log(yellow('如果输入错误,请按'), red('【Ctrl+c】'), yellow('退出重来哦~'))

    let result: prompts.Answers<'appID' | 'token'> = await prompts([
      {
        type: 'text',
        name: 'appID',
        message: green('your appID: '),
        validate: value => (value !== '' && typeof value === 'string' ? true : 'your appID')
      },
      {
        type: 'text',
        name: 'token',
        message: green('your token: '),
        validate: value => (value !== '' && typeof value === 'string' ? true : 'your token')
      }
    ])

    const { appID, token } = result

    if (!appID || !token) process.exit()

    let str = readFileSync(join(__dirname, Dcf), 'utf-8')

    str = str.replace(/appID(.*)''/g, `appID: '${appID}'`)
    str = str.replace(/token(.*)''/g, `token: '${token}'`)

    // 以递归的方式创建目录
    mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })
    /* 写入 */
    writeFileSync(join(process.cwd(), Bcf), str)

    console.log(green('[create config]]'), Bcf)

    const file = join(process.cwd(), Bcf)

    const config = readYaml(file)
    /* 转为全局变量 */
    global.cfg = config.account
  }
}
