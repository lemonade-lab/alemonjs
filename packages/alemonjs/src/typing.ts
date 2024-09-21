/**
 *
 */
export type AEventByMessageCreate = {
  /**
   *
   */
  Platform: string
  /**
   *
   */
  GuildId: string
  /**
   *
   */
  ChannelId: string
  /**
   *
   */
  UserId: string
  /**
   *
   */
  UserName: string
  /**
   * 用户头像地址
   */
  UserAvatar: string
  /**
   *
   */
  MsgId: string
  /**
   *
   */
  Megs: any[]
  /**
   *
   */
  OpenID: string
  /**
   * 捕获原始消息格式
   */
  value: any
}

/**
 *
 */
export type AEventByMessageDelete = {
  Platform: string
  value: any
}

/**
 *
 */
export type AEventByMessageUpdate = {
  Platform: string
  value: any
}

/**
 *
 */
export type AEvents = {
  /**
   * 消息创建
   */
  'message.create': AEventByMessageCreate
  /**
   * 消息撤回
   */
  'message.delete': AEventByMessageDelete
  /**
   * 消息更新
   */
  'message.update': AEventByMessageUpdate
}
