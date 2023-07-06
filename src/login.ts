import { readFileSync, watch, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import prompts from 'prompts'
// 非依赖引用
import { BotConfigType, AvailableIntentsEventsEnum } from 'alemon'
import { getYaml } from 'alemon'

let cfg: BotConfigType

/**
 * 监听登录
 * @param val
 * @param text1
 * @param text2
 */
function watchLogin(val: string, text1: string, text2: string) {
  console.log(text1)
  watch(val, async () => {
    setTimeout(async () => {
      const configA = getYaml(val)
      const configB = cfg
      if ((configA ?? '') === '' || JSON.stringify(configB) !== JSON.stringify(configA)) {
        console.error(text2)
        process.exit()
      }
    }, 500)
  })
}

/**
 * 登录配置
 * @param Dcf
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobot(Dcf: string, Bcf: string, val?: number): Promise<BotConfigType> {
  const config: BotConfigType = getYaml(join(process.cwd(), Bcf))
  if (
    (config ?? '') !== '' &&
    (config.appID ?? '') !== '' &&
    (config.token ?? '') !== '' &&
    val !== 0
  ) {
    if (!config.intents) {
      config.intents = [
        AvailableIntentsEventsEnum.GUILDS,
        AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
        AvailableIntentsEventsEnum.DIRECT_MESSAGE,
        AvailableIntentsEventsEnum.GUILD_MEMBERS
      ]
    }
    cfg = config
    return cfg
  }

  console.info('[LOGIN]', '-----------------------')
  console.info('[LOGIN]', '退出重来？可按', '[CTRL+C]')
  console.info('[LOGIN]', '更改登录？执行', 'npm run login')
  console.info('[LOGIN]', '-----------------------')
  console.info('[LOGIN]', '现在,请先根据指令提示输入基础信息')
  console.info('[LOGIN]', '-----------------------')

  const { appID, token, inputBot, imputDev } = await prompts([
    {
      type: 'password',
      name: 'appID',
      message: 'BotAppID: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : 'BotAppID: ')
    },
    {
      type: 'password',
      name: 'token',
      message: 'BotSecret: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : 'BotSecret: ')
    },
    {
      type: 'select',
      name: 'inputBot',
      message: '请选择机器人类型 :',
      choices: [
        { title: '公域', value: '0' },
        { title: '私域', value: '1' }
      ],
      initial: 0 //默认公域
    },
    {
      type: 'select',
      name: 'imputDev',
      message: '请选择机器人环境 :',
      choices: [
        { title: '部署环境', value: '0' },
        { title: '开发环境', value: '1' }
      ],
      initial: 0 //默认部署
    }
  ]).catch((err: any) => {
    console.log(err)
    process.exit()
  })

  if (!appID || !token || !inputBot || !imputDev) process.exit()

  //默认公域机器人
  let intents = [
    AvailableIntentsEventsEnum.GUILDS, //别野进出
    AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
    AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
    //公域特有
    AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES //公域事件
    // OPEN_FORUMS_EVENT //公域论坛
  ]
  //默认公域机器人
  let isPrivate = false

  if (inputBot == '1') {
    //私域机器人
    intents = [
      AvailableIntentsEventsEnum.GUILDS, //别野进出
      AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
      AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
      //需申请的
      AvailableIntentsEventsEnum.AUDIO_ACTION, //音频
      AvailableIntentsEventsEnum.MESSAGE_AUDIT, //消息审核
      AvailableIntentsEventsEnum.INTERACTION, //互动事件
      AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, //表情表态
      //私域特有
      AvailableIntentsEventsEnum.GUILD_MESSAGES, //私域事件
      AvailableIntentsEventsEnum.FORUMS_EVENT //私域论坛
    ]
    //私域机器人
    isPrivate = true
  }

  // 默认部署
  let sandbox = false
  if (imputDev == '1') {
    // 开发环境
    sandbox = true
  }

  let str = readFileSync(Dcf, 'utf-8')

  str = str
    .replace(/appID: ''/g, `appID: '${appID}'`)
    .replace(/token: ''/g, `token: '${token}'`)
    .replace(/intents:\s*\[\s*\]/g, `intents: [${intents}]`)
    .replace(/isPrivate:\s*false/g, `isPrivate: ${isPrivate}`)
    .replace(/sandbox:\s*false/g, `sandbox: ${sandbox}`)

  // 确保目录存在
  mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })

  // 写入内容
  writeFileSync(join(process.cwd(), Bcf), str)

  console.info('[CTRETE]', join(process.cwd(), Bcf))

  watchLogin(join(process.cwd(), Bcf), '[WARCH] 配置监听启动', '[WARCH] 请重启!')

  cfg = {
    appID,
    token,
    intents,
    isPrivate,
    sandbox,
    masterID: '',
    password: ''
  }
  return cfg
}
