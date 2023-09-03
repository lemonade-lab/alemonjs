import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import prompts from 'prompts'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { getBotConfigByQQ, setBotConfigbyQQ } from './config.js'
import { LoginConfigByQQ } from './types.js'
import { getYaml } from '../config.js'
import { watchLogin } from '../watch.js'

/**
 * 登录配置
 * @param Bcf
 * @returns
 */
export async function checkRobotByQQ(Bcf: string) {
  if (process.argv.indexOf('login') == -1) {
    const config: LoginConfigByQQ = getYaml(join(process.cwd(), Bcf))
    if ((config ?? '') !== '' && (config.appID ?? '') !== '' && (config.token ?? '') !== '') {
      if (!config.intents) {
        config.intents = [
          AvailableIntentsEventsEnum.GUILDS,
          AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
          AvailableIntentsEventsEnum.DIRECT_MESSAGE,
          AvailableIntentsEventsEnum.GUILD_MEMBERS
        ]
      }
      setBotConfigbyQQ(config)
      return true
    }
  }

  console.info('[LOGIN]', '-----------------------')
  console.info('[LOGIN]', '推荐将机器人设置', '订阅推送', '打开')
  console.info('[LOGIN]', '推荐将机器人设置', '私聊权限', '打开')
  console.info('[LOGIN]', '非管理类机器推荐', '普通成员', '身份')
  console.info('[LOGIN]', '-----------------------')
  console.info('[LOGIN]', '退出重来？可按', '[CTRL+C]')
  console.info('[LOGIN]', '更改登录？执行', 'npm run login')
  console.info('[LOGIN]', '-----------------------')

  const timeoutId = setTimeout(() => {
    throw '超过1分钟未完成登录'
  }, 60000)

  const { appID, token, inputBot, imputDev } = await prompts([
    {
      type: 'password',
      name: 'appID',
      message: 'BotAppID: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 appID: ')
    },
    {
      type: 'password',
      name: 'token',
      message: 'BotToken: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 token: ')
    },
    {
      type: 'select',
      name: 'inputBot',
      message: '请选择机器人类型 :',
      choices: [
        { title: '公域', value: '0' },
        { title: '私域', value: '1' }
      ],
      /**
       * 默认公域
       */
      initial: 0
    },
    {
      type: 'select',
      name: 'imputDev',
      message: '请选择机器人环境 :',
      choices: [
        { title: '部署环境', value: '0' },
        { title: '开发环境', value: '1' }
      ],
      /**
       * 默认部署
       */
      initial: 0
    }
  ]).catch((err: any) => {
    console.error(err)
    process.exit()
  })

  if (!appID || !token || !inputBot || !imputDev) {
    return false
  }

  clearTimeout(timeoutId)
  /**
   * 默认公域机器人
   */
  let intents = [
    AvailableIntentsEventsEnum.GUILDS, //频道进出
    AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
    AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
    /**
     * 公域特有
     */
    AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES //公域事件
  ]
  /**
   * 默认公域机器人
   */
  let isPrivate = false

  if (inputBot == '1') {
    /**
     * 私域机器人
     */
    intents = [
      AvailableIntentsEventsEnum.GUILDS, //频道进出
      AvailableIntentsEventsEnum.GUILD_MEMBERS, //成员资料
      AvailableIntentsEventsEnum.DIRECT_MESSAGE, //私信
      /**
       * 需申请的
       */
      AvailableIntentsEventsEnum.AUDIO_ACTION, //音频
      AvailableIntentsEventsEnum.MESSAGE_AUDIT, //消息审核
      AvailableIntentsEventsEnum.INTERACTION, //互动事件
      AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, //表情表态
      /**
       * 私域特有
       */
      AvailableIntentsEventsEnum.GUILD_MESSAGES, //私域事件
      AvailableIntentsEventsEnum.FORUMS_EVENT //私域论坛
    ]
    /**
     * 私域机器人
     */
    isPrivate = true
  }

  /**
   * 默认部署
   */
  let sandbox = false
  if (imputDev == '1') {
    /**
     * 开发环境
     */
    sandbox = true
  }

  let str = `# 机器人应用编号 BotAppID
appID: '' 
# 机器人令牌 BotToken
token: '' 
# 主人编号 masterId
masterID: '' 
# 主人密码 mastetPassword
password: '' 
# 监听事件
intents: [] 
# 是否是私域  默认公域
isPrivate: false
# 是否是沙箱  默认部署
sandbox: false`

  str = str
    .replace(/appID: ''/g, `appID: '${appID}'`)
    .replace(/token: ''/g, `token: '${token}'`)
    .replace(/intents:\s*\[\s*\]/g, `intents: [${intents}]`)
    .replace(/isPrivate:\s*false/g, `isPrivate: ${isPrivate}`)
    .replace(/sandbox:\s*false/g, `sandbox: ${sandbox}`)

  /**
   * 确保目录存在
   */
  mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })

  /**
   * 写入内容
   */
  writeFileSync(join(process.cwd(), Bcf), str)

  console.info('[CTRETE]', join(process.cwd(), Bcf))

  watchLogin(join(process.cwd(), Bcf), getBotConfigByQQ)

  setBotConfigbyQQ({
    appID,
    token,
    intents,
    isPrivate,
    sandbox,
    masterID: '',
    password: ''
  })
  return true
}
