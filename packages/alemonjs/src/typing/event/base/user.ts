// 用户
export type User = {
  /**
   * 用户编号
   */
  UserId: string
  /**
   * 用户名
   */
  UserName: string
  /**
   * 用户头像地址
   */
  UserAvatar: string
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
