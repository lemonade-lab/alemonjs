import { QQBotGuildIntentsEnum } from './typings.js'
import { BaseConfig } from '../../../core/config.js'

export const config = new BaseConfig<{
  appID: string
  token: string
  secret: string
  intents: QQBotGuildIntentsEnum[]
  sandbox: boolean
  shard?: number[]
}>({
  appID: '',
  token: '',
  secret: '',
  // default
  intents: [
    'GUILDS', //频道进出
    'MEMBERS', //成员资料
    'DIRECT_MESSAGE', //私信
    'PUBLIC_GUILD_MESSAGES', //公域事件
    'REACTIONS' // 表情表态
  ],
  sandbox: false,
  shard: [0, 1]
})
