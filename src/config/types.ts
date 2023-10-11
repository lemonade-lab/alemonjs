import { GatewayIntentBits } from 'discord.js'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'

/**
 * ******
 * config
 * ******
 */
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

/**
 * ****
 * redis
 * *****
 */
export interface RedisConfig {
  host: string
  port: number
  password: string
  db: number
}

/**
 * ***
 * mysql
 * **
 */
export interface MysqlConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

/**
 * **
 * discord
 * **
 */
export interface DiscordConfig {
  token: string
  masterID: string
  password: string
  intents: GatewayIntentBits[]
}

/**
 * ****
 * kook
 * ***
 */
export interface KookConfig {
  token: string
  masterID: string
  password: string
}

/**
 * ****
 * villa
 * *****
 */
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

/**
 * *****
 * ntqq
 * ****
 */

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
  port: number
  size: number
  img_url: string
  IMAGE_DIR: string
  http: string
}

/**
 * ******
 * qq
 * *****
 */
export interface QQConfig {
  appID: string
  token: string
  masterID: string
  password: string
  intents: AvailableIntentsEventsEnum[]
  isPrivate: boolean
  sandbox: boolean
}

/**
 * ******
 * server
 * *****
 */
export interface ServerConfig {
  host: string
  port: number
}

/**
 * ********
 * pup
 * *******
 */
export interface PuppeteerConfig {
  args: string[]
  headless: 'new'
  timeout: number
}
