import { VILLAOptions } from '../villa/villa.js'
import { KOOKOptions } from '../kook/kook.js'
import { QQOptions } from '../qq/qq.js'
import { NTQQOptions } from '../ntqq/ntqq.js'
import { DISOCRDOptions } from '../discord/discord.js'
/**
 * *****
 * login
 * ****
 */
export interface LoginOptions {
  /**
   * 支持其他配置
   */
  [key: string]: any
  /**
   * kook配置
   */
  kook?: KOOKOptions
  /**
   * villa配置
   */
  villa?: VILLAOptions
  /**
   * qq配置
   */
  qq?: QQOptions
  /**
   * ntqq配置
   */
  ntqq?: NTQQOptions
  /**
   * discord配置
   */
  discord?: DISOCRDOptions
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
