import { QQBotGuildIntentsEnum } from './typings.js'

/**
 * ******
 * qq
 * *****
 */
export interface QQOptions {
  /**
   * 应用编号
   */
  appId: string
  /**
   * 钥匙
   */
  token: string
  /**
   * 密钥
   */
  secret?: string
  /**
   * 分片
   * [0, 1]
   */
  shard?: number[]
  /**
   * 事件订阅
   */
  intents?: QQBotGuildIntentsEnum[]
  /**
   * 是否是私域
   * false
   */
  isPrivate?: boolean
  /**
   * 是否是沙盒环境
   * false
   */
  sandbox?: boolean
}
