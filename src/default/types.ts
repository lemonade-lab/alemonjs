import { GatewayIntentBits } from 'discord.js'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
/**
 * *****
 * login
 * ****
 */
export interface LoginOptions {
  /**
   * discord配置
   */
  discord?: DiscordOptions
  /**
   * kook配置
   */
  kook?: KookOptionsg
  /**
   * villa配置
   */
  villa?: VillaOptions
  /**
   * qq配置
   */
  qq?: QqGuildOptions
  /**
   * ntqq配置
   */
  ntqq?: NtQQOptions
}

/**
 * ****
 * redis
 * *****
 */
export interface RedisOptions {
  /**
   * 地址
   */
  host?: string
  /**
   * 端口
   */
  port?: number
  /**
   * 密码
   */
  password?: string
  /**
   * 数据库名
   */
  db?: number
}

/**
 * ***
 * mysql
 * **
 */
export interface MysqlOptions {
  /**
   * 地址
   */
  host?: string
  /**
   * 端口
   */
  port?: number
  /**
   * 用户名
   */
  user?: string
  /**
   * 密码
   */
  password?: string
  /**
   * 数据库名
   */
  database?: string
}

/**
 * **
 * discord
 * **
 */
export interface DiscordOptions {
  /**
   * 钥匙
   */
  token?: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
  /**
   * 事件订阅
   */
  intents?: GatewayIntentBits[]
}

/**
 * ****
 * kook
 * ***
 */
export interface KookOptionsg {
  /**
   * 钥匙
   */
  token?: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
}

/**
 * ****
 * villa
 * *****
 */
export interface VillaOptions {
  /**
   * 机器人编号
   */
  bot_id?: string
  /**
   * 密钥
   */
  secret?: string
  /**
   * 公匙
   */
  pub_key?: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
  http?: string
  url?: string
  port?: number
  size?: number
  img_url?: string
  IMAGE_DIR?: string
}

/**
 * *****
 * ntqq订阅
 * ****
 */
export enum NtQQEventsEnum {
  /**
   * 群聊消息
   */
  GROUP_AT_MESSAGE_CREATE = 'GROUP_AT_MESSAGE_CREATE',
  /**
   * 单聊消息
   */
  C2C_MESSAGE_CREATE = 'C2C_MESSAGE_CREATE'
}

/**
 * *****
 * ntqq
 * ****
 */
export interface NtQQOptions {
  appID?: string
  token?: string
  secret?: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
  /**
   * 事件订阅
   */
  intents?: NtQQEventsEnum[]
  port?: number
  size?: number
  img_url?: string
  IMAGE_DIR?: string
  http?: string
}

/**
 * ******
 * qq
 * *****
 */
export interface QqGuildOptions {
  appID?: string
  token?: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 主人密码
   */
  password?: string
  /**
   * 事件订阅
   */
  intents?: AvailableIntentsEventsEnum[]
  isPrivate?: boolean
  sandbox?: boolean
}

/**
 * ******
 * server
 * *****
 */
export interface ServerOptions {
  /**
   * 地址
   */
  host?: string
  /**
   * 端口
   */
  port?: number
}
