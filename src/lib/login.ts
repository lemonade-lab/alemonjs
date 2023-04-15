import { dirname, join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import prompts from 'prompts'
import { green, yellow } from 'kolorist'
/* 非依赖引入 */
import { readYaml } from './tool'
/**机器人登录*/
declare global {
  var cfg: {
    appID: string
    token: string
    intents?: []
    sandbox?: boolean
  }
}

export async function check(): Promise<any> {
  const file = join(process.cwd(), './config/config.yaml')
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
    console.log(yellow('请按提示输入'))
    console.log(yellow('生成配置文件config.yaml'))
    console.log(yellow('输入错误【Ctrl+c】结束重来'))

    let result: prompts.Answers<'appID' | 'token'>
    result = await prompts([
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

    let str = readFileSync(join(__dirname, '../config/config_default.yaml'), 'utf-8')

    str = str.replace(/appID(.*)''/g, `appID: '${appID}'`)
    str = str.replace(/token(.*)''/g, `token: '${token}'`)

    // 以递归的方式创建目录
    mkdirSync(dirname(join(process.cwd(), '/config/config.yaml')), { recursive: true })
    writeFileSync(join(process.cwd(), '/config/config.yaml'), str)

    console.log(green('[create config]]\nconfig/config.yaml'))

    const file = join(process.cwd(), '/config/config.yaml')
    const config = readYaml(file)
    /* 转为全局变量 */
    global.cfg = config.account
  }
}
