import { GatewayIntentBits } from 'discord.js'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
export interface RedisConfig {
  host: string
  port: number
  password: string
  db: number
}

export interface MysqlConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export interface DiscordConfig {
  token: string
  masterID: string
  password: string
  intents: GatewayIntentBits[]
}

export interface KookConfig {
  token: string
  masterID: string
  password: string
}

export interface VillaConfig {
  bot_id: string
  secret: string
  pub_key: string
  masterID: string
  password: string
  http: string
  url: string
  port: number
  size: number
  img_url: string
  IMAGE_DIR: string
}

export enum NtQQEventsEnum {
  GROUP_AT_MESSAGE_CREATE = 'GROUP_AT_MESSAGE_CREATE', // 群艾特消息
  C2C_MESSAGE_CREATE = 'C2C_MESSAGE_CREATE' // 单聊消息
}

export interface NtQQConfig {
  appID: string
  token: string
  secret: string
  masterID: string
  password: string
  intents: NtQQEventsEnum[]
}

export interface QQConfig {
  appID: string
  token: string
  masterID: string
  password: string
  intents: AvailableIntentsEventsEnum[]
  isPrivate: boolean
  sandbox: boolean
}

export interface ServerConfig {
  host: string
  port: number
}

export interface PuppeteerConfig {
  args: string[]
  headless: 'new'
  timeout: number
}

export interface ConfigType {
  redis?: RedisConfig
  mysql?: MysqlConfig
  discord?: DiscordConfig
  kook?: KookConfig
  villa?: VillaConfig
  qq?: QQConfig
  server?: ServerConfig
  puppeteer?: PuppeteerConfig
  ntqq?: NtQQConfig
}
