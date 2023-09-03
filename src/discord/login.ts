import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import prompts from 'prompts'
import { GatewayIntentBits } from 'discord.js'
import { getBotConfigByDiscord, setBotConfigByDiscord } from './config.js'
import { LoginConfigByDiscord } from './types.js'
import { getYaml } from '../config.js'
import { watchLogin } from '../watch.js'

// GatewayIntentBits.AutoModerationConfiguration, // 自动调节配置
// GatewayIntentBits.AutoModerationExecution, // 自动调节执行

// 消息

// GatewayIntentBits.DirectMessageReactions, // 直接消息反应
// GatewayIntentBits.DirectMessageTyping, // 直接消息键入
// GatewayIntentBits.DirectMessages, // 直接消息

// 公会

// GatewayIntentBits.GuildEmojisAndStickers, // 帮会表情符号和贴纸，
// GatewayIntentBits.GuildIntegrations, // 帮会整合，
// GatewayIntentBits.GuildInvites, // 帮会邀请，
// GatewayIntentBits.GuildEmojisAndStickers, // 帮会表情符号和贴纸，
// GatewayIntentBits.GuildMessageReactions, // 帮会消息反应，
// GatewayIntentBits.GuildMessageTyping, // 帮会消息打字，
// GatewayIntentBits.GuildMessages, // 帮会消息
// GatewayIntentBits.GuildModeration, // 帮会审核，
// GatewayIntentBits.GuildPresences, // 帮会礼物，
// GatewayIntentBits.GuildScheduledEvents, // 帮会预定活动，
// GatewayIntentBits.GuildVoiceStates, // 帮会音频，
// GatewayIntentBits.GuildWebhooks, //帮会网络挂钩，
// GatewayIntentBits.Guilds, // 帮会，

// GatewayIntentBits.MessageContent // 消息内容

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByDiscord(Bcf: string) {
  /**
   * 读取配置
   */
  if (process.argv.indexOf('login') == -1) {
    const config: LoginConfigByDiscord = getYaml(join(process.cwd(), Bcf))
    if ((config ?? '') !== '' && (config.token ?? '') !== '') {
      if (!config.intents) {
        config.intents = [
          GatewayIntentBits.DirectMessageReactions, // 直接消息反应
          GatewayIntentBits.DirectMessageTyping, // 直接消息键入
          GatewayIntentBits.DirectMessages, // 直接消息
          GatewayIntentBits.GuildMessageReactions, // 帮会消息反应，
          GatewayIntentBits.GuildMessageTyping, // 帮会消息打字，
          GatewayIntentBits.GuildMessages, // 帮会消息
          GatewayIntentBits.Guilds, // 帮会监听
          GatewayIntentBits.MessageContent // 消息内容
        ]
      }
      /**
       * 设置机器人配置
       */
      setBotConfigByDiscord(config)
      return true
    }
  }

  console.info('[LOGIN]', '-----------------------')

  const timeoutId = setTimeout(() => {
    throw '超过1分钟未完成登录'
  }, 60000)

  const { token } = await prompts([
    {
      type: 'password',
      name: 'token',
      message: 'BotToken: ',
      validate: value => (value !== '' && typeof value === 'string' ? true : '机器人 token: ')
    }
  ])

  if (!token) {
    return false
  }

  clearTimeout(timeoutId)
  /**
   * 默认公域机器人
   */
  const intents = [
    GatewayIntentBits.DirectMessageReactions, // 直接消息反应
    GatewayIntentBits.DirectMessageTyping, // 直接消息键入
    GatewayIntentBits.DirectMessages, // 直接消息
    GatewayIntentBits.GuildMessageReactions, // 帮会消息反应，
    GatewayIntentBits.GuildMessageTyping, // 帮会消息打字，
    GatewayIntentBits.GuildMessages, // 帮会消息
    GatewayIntentBits.Guilds, // 帮会监听
    GatewayIntentBits.MessageContent // 消息内容
  ]

  let str = `token: '' # 机器人令牌 
masterID: '' # 主人编号 
password: '' # 主人密码 
intents: [] # 监听事件`

  str = str
    .replace(/token: ''/g, `token: '${token}'`)
    .replace(/intents:\s*\[\s*\]/g, `intents: [${intents}]`)

  /**
   * 确保目录存在
   */
  mkdirSync(dirname(join(process.cwd(), Bcf)), { recursive: true })

  /**
   * 写入内容
   */
  writeFileSync(join(process.cwd(), Bcf), str)

  console.info('[CTRETE]', join(process.cwd(), Bcf))

  watchLogin(join(process.cwd(), Bcf), getBotConfigByDiscord)

  setBotConfigByDiscord({
    token,
    intents,
    masterID: '',
    password: ''
  })
  return true
}
