/**
 * *****
 * ntqq订阅
 * ****
 */
export enum NTQQEventsEnum {
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
  masterID?: string
  /**
   * 事件订阅
   */
  intents?: NTQQEventsEnum[]
  /***
   * 分片
   */
  shard?: number[]
}

export const defineNtqq = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  intents: [
    'GROUP_AT_MESSAGE_CREATE',
    'C2C_MESSAGE_CREATE'
  ] as NTQQEventsEnum[],
  shard: [0, 1]
}
