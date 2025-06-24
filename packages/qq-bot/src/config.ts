import { getConfigValue, useUserHashKey } from 'alemonjs'
import { IntentsEnum } from './sdk/intents'
export const platform = 'qq-bot'

export interface Options {
  /**
   * 密钥
   */
  secret: string
  /**
   * 应用编号
   */
  app_id: string
  /**
   * 令牌
   */
  token: string
  /**
   * 沙盒环境
   */
  sandbox?: boolean
  /**
   * 路由地址
   */
  route?: string
  /**
   * 端口
   */
  port?: string
  /**
   * WebSocket 地址
   */
  ws?: string
  /**
   * 网关地址
   */
  gatewayURL?: string
  /**
   * 分片
   */
  shard?: [number, number]
  /**
   * 是否是私域
   */
  is_private?: boolean
  /**
   * 事件订阅
   */
  intents?: IntentsEnum[]
  /**
   * 模式
   */
  mode?: 'guild' | 'group' | ''
  /**
   * 主人-用户KEY
   */
  master_key?: string[]
  /**
   * 主人-用户ID
   */
  master_id?: string[]
}

export const getQQBotConfig = (): Options => {
  const value = getConfigValue() || {}
  return value[platform] || {}
}
export const getMaster = (UserId: string) => {
  const config = getQQBotConfig()
  const master_key = config.master_key || []
  const master_id = config.master_id || []
  const UserKey = useUserHashKey({
    Platform: platform,
    UserId: UserId
  })
  const is = master_key.includes(UserKey) || master_id.includes(UserId)
  return [is, UserKey] as const
}
