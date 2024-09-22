import { IntentsEnum } from './intents.js'

/**
 * *****
 * ntqq
 * ****
 */
export interface NTQQOptions {
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
  secret: string
  /**
   * 主人编号
   */
  masterID?: string | string[]
  /**
   * 事件订阅
   */
  intents?: IntentsEnum[]
  /***
   * 分片
   */
  shard?: number[]
  /**
   * 是否是私域
   */
  isPrivate?: boolean
  /**
   * 是否是沙盒环境
   */
  sandbox?: boolean
}

export const defineNtqq: NTQQOptions = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  intents: ['GROUP_AT_MESSAGE_CREATE', 'C2C_MESSAGE_CREATE'] as IntentsEnum[],
  shard: [0, 1],
  isPrivate: false,
  sandbox: false
}
