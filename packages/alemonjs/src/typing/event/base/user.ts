// 用户
export type User = {
  /**
   * 用户编号
   */
  UserId: string
  /**
   * user unique id key
   * 使用`${Platform}:${UserId}`哈希所得
   * 统一长度
   */
  UserKey: string
  /**
   * 用户名
   */
  UserName?: string
  /**
   * 用户头像地址
   */
  UserAvatar?: {
    toURL: () => Promise<string>
    toBase64: () => Promise<string>
    toBuffer: () => Promise<Buffer>
  }
  /**
   * 是否是主人
   */
  IsMaster: boolean
}

// 机器人
export type Bot = {
  BotId: string
  BotName: string
  BotAvatar: string
}
