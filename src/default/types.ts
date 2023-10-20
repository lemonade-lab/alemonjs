import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
/**
 * *****
 * login
 * ****
 */
export interface LoginOptions {
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
  /**
   * 回调地址
   */
  url?: string
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

/**
 * ******
 * qq
 * *****
 */
export interface QqGuildOptions {
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
