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
   * 主人密码
   */
  password?: string
  /**
   * 事件订阅
   */
  intents?: NTQQEventsEnum[]
  /**
   * 模式
   */
  mode?: 'ntqq' | 'qq' | 'whole'
  /**
   * 分片
   */
  shard?: number[]
  /**
   * 端口
   */
  port?: number
  /**
   * 随机数大小
   */
  size?: number
  /**
   * 图片路由
   */
  img_url?: string
  /**
   * 本地缓存图地址
   */
  IMAGE_DIR?: string
  /**
   * 头模式
   */
  http?: string
}

export const defineNtqq = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  password: '',
  intents: [
    'GROUP_AT_MESSAGE_CREATE',
    'C2C_MESSAGE_CREATE'
  ] as NTQQEventsEnum[],
  shard: [0, 1],
  port: 9090,
  size: 999999,
  img_url: '/api/mys/img',
  IMAGE_DIR: '/data/mys/img',
  http: 'http'
}
