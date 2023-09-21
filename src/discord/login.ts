import prompts from 'prompts'
import { GatewayIntentBits } from 'discord.js'
import { setBotConfigByKey, getBotConfigByKey } from '../login.js'
import { getToml, writeToml } from '../config.js'

/**
 * 登录配置
 * @param Bcf
 * @param val
 * @returns
 */
export async function checkRobotByDiscord() {
  /**
   * 读取配置
   */
  if (process.argv.indexOf('login') == -1) {
    const config = getBotConfigByKey('discord')
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
      setBotConfigByKey('discord', config)
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
      validate: value => (value !== '' && typeof value === 'string' ? true : 'BotToken: ')
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

  // 得到已变更的配置
  const db = getBotConfigByKey('discord')
  // 得到配置
  const data = getToml()
  data.discord = {
    ...db,
    // 覆盖新配置
    token,
    intents
  }
  // 写入配置
  writeToml(data)
  // 设置配置
  setBotConfigByKey('discord', data.discord)
  return true
}

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
