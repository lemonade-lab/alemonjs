import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
export const defineQQ = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  password: '',
  intents: [
    AvailableIntentsEventsEnum.GUILDS,
    AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
    AvailableIntentsEventsEnum.DIRECT_MESSAGE
  ] as AvailableIntentsEventsEnum[],
  isPrivate: false,
  sandbox: false
}
/**
 * ******
 * qq
 * *****
 */
export interface QQOptions {
  /**
   * 应用编号
   */
  appID?: string
  /**
   * 钥匙
   */
  token?: string
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
   * 主人密码
   */
  password?: string
  /**
   * 事件订阅
   */
  intents?: AvailableIntentsEventsEnum[]
  /**
   * 是否是私域
   */
  isPrivate?: boolean
  /**
   * 是否是沙盒环境
   */
  sandbox?: boolean
}
