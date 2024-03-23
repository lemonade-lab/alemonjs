import { KOOKOptions } from '../platform/kook/sdk/wss.js'
import { QQOptions } from '../platform/qq/sdk/wss.js'
import { NTQQOptions } from '../platform/ntqq/sdk/wss.js'
import { DISOCRDOptions } from '../platform/discord/sdk/wss.js'
import { ControllersType } from '../core/index.js'

export type PlatformsItemType = {
  /**
   * 机器人名称与login对应
   */
  name: string
  /**
   * 登录
   */
  login: (
    /**
     * 登录配置
     */
    options: any
  ) => any
  /**
   * 控制器
   */
  controllers: ControllersType
}

/**
 * *****
 * login
 * ****
 */
export type LoginOptions = {
  /**
   * kook配置
   */
  kook?: KOOKOptions
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
