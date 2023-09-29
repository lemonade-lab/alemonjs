/**
 * 登录配置
 */
export interface BotConfig {
  appID: string
  token: string
  secret: string
  intents: IntentsEnum[]
}

/**
 *
 */
export type IntentsEnum = (typeof AvailableIntentsEventsEnum)[number]

/**
 * 订阅枚举
 */
export const AvailableIntentsEventsEnum = [
  'FRIEND_ADD',
  'GROUP_AT_MESSAGE_CREATE', // 群艾特消息
  'C2C_MESSAGE_CREATE', // 单聊消息
  'INTERACTION_CREATE'
] as const
