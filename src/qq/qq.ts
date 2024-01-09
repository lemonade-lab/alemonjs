import { IntentsEnum } from './sdk/typings.js'

/**
 * ******
 * qq
 * *****
 */
export interface QQOptions {
  /**
   * 应用编号
   */
  appID: string
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
   */
  shard?: number[]
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 事件订阅
   */
  intents?: IntentsEnum[]
  /**
   * 是否是私域
   */
  isPrivate?: boolean
  /**
   * 是否是沙盒环境
   */
  sandbox?: boolean
}

export const defineQQ: QQOptions = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  intents: [
    'GUILDS', //频道进出
    'GUILD_MEMBERS', //成员资料
    'DIRECT_MESSAGE', //私信
    'PUBLIC_GUILD_MESSAGES' //公域事件
  ],
  isPrivate: false,
  sandbox: false,
  shard: [0, 1]
}
