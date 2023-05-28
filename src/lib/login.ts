import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { green, yellow } from 'kolorist'
import { dirname, join } from 'path'
import { createHash } from 'crypto'
import { watch } from 'fs'
import prompts from 'prompts'
import { BotConfigType } from 'alemon'

/* 非依赖引入 */
import { getYaml } from './tool'
import { Bcf, Dcf } from '../../app.config'

declare global {
  var cfg: BotConfigType
}

function watchC() {
  console.log('[WARCH] 配置监听启动~')
  watch(join(process.cwd(), Bcf), async () => {
    setTimeout(async () => {
      const file = join(process.cwd(), Bcf)
      const config = getYaml(file)
      if (
        (config ?? '') === '' ||
        (config.account ?? '') === '' ||
        JSON.stringify(cfg) !== JSON.stringify(config.account)
      ) {
        console.error(Bcf)
        console.error('[WARCH] 请重启!')
        process.exit()
      }
    }, 500)
  })
}

export async function check(login?: number): Promise<any> {
  const file = join(process.cwd(), Bcf)
  const config = getYaml(file)
  if (
    (config ?? '') !== '' &&
    (config.account ?? '') !== '' &&
    (config.account.appID ?? '') !== '' &&
    (config.account.token ?? '') !== '' &&
    (config.account.secretKey ?? '') !== '' &&
    login !== 0
  ) {
    if (!config.account.intents) {
      config.account.intents = [
        AvailableIntentsEventsEnum.GUILDS,
        AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
        AvailableIntentsEventsEnum.DIRECT_MESSAGE,
        AvailableIntentsEventsEnum.GUILD_MEMBERS
      ]
    }
    if (!config.account.intents) {
      config.account.intents = false
    }
    config.account.masterID = createHash('sha256').update(config.account.appID).digest('hex')
    global.cfg = config.account
  } else {
    console.info('[LOGIN]', '-----------------------')
    console.info('[LOGIN]', '推荐将机器人设置', yellow('管理员'))
    console.info('[LOGIN]', '推荐将机器人设置', yellow('订阅推送'), '打开')
    console.info('[LOGIN]', '推荐将机器人设置', yellow('私聊权限'), '打开')
    console.info('[LOGIN]', '-----------------------')
    console.info('[LOGIN]', '退出重来？可按', yellow('[CTRL+C]'))
    console.info('[LOGIN]', '更改登录？执行', yellow('npm run login'))
    console.info('[LOGIN]', yellow('现在,请先根据指令提示输入基础信息~'))

    const { appID, token, imputPwd, inputBot, imputDev } = await prompts([
      {
        type: 'password',
        name: 'appID',
        message: green('机器人 appID: '),
        validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 appID: ')
      },
      {
        type: 'password',
        name: 'token',
        message: green('机器人 token: '),
        validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 token: ')
      },
      {
        type: 'password',
        name: 'imputPwd',
        message: green('自定义 secretKey: '),
        validate: value =>
          value !== '' && typeof value === 'string' && value.length >= 6 && value.length <= 16
            ? true
            : '自定义 secretKey: '
      },
      {
        type: 'text',
        name: 'inputBot',
        message: green('是否是私域机器人?(y/n)'),
        validate: value => {
          if (value === 'y' || value === 'n') return true
          return '是否是私域机器人?(y/n)'
        }
      },
      {
        type: 'text',
        name: 'imputDev',
        message: green('是否启用开发环境?(y/n)'),
        validate: value => {
          if (value === 'y' || value === 'n') return true
          return '是否启用开发环境?(y/n)'
        }
      }
    ])

    if (!appID || !token || !imputPwd || !inputBot || !imputDev) process.exit()

    const secretKey = createHash('sha256').update(`${appID}:${imputPwd}`).digest('hex')

    let intents = [
      AvailableIntentsEventsEnum.GUILDS,
      AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
      AvailableIntentsEventsEnum.DIRECT_MESSAGE,
      AvailableIntentsEventsEnum.GUILD_MEMBERS
    ]
    if (inputBot == 'y') intents = []

    let sandbox = false

    if (imputDev == 'y') sandbox = true

    let str = readFileSync(join(process.cwd(), Dcf), 'utf-8')

    str = str.replace(/appID(.*)''/g, `appID: '${appID}'`)
    str = str.replace(/token(.*)''/g, `token: '${token}'`)
    str = str.replace(/secretKey(.*)''/g, `secretKey: '${secretKey}'`)
    str = str.replace(/intents:\s*\[\s*\]/g, `intents: [${intents}]`)
    str = str.replace(/sandbox:\s*false/g, `sandbox: ${sandbox}`)

    mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })

    writeFileSync(join(process.cwd(), Bcf), str)

    console.info('[CTRETE]', Bcf)

    global.cfg = {
      appID,
      token,
      intents,
      sandbox,
      secretKey,
      masterID: createHash('sha256').update(appID).digest('hex')
    }
  }

  watchC()
}
