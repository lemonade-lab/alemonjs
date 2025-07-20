import { EventKeys } from '../typings'

export type ParsedMessage = {
  apiId?: string
  actionId?: string
  testID?: string
  ChannelId?: string
  GuildId?: string
  name?: EventKeys
  DeviceId?: string
  activeId?: string
  /**
   * 负载
   */
  payload?: any
  // 其他信息
  [key: string]: any
}
