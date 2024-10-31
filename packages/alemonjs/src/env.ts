export type LogType = string | Error | unknown

/**
 *
 */
export type AEventByMessageCreate = {
  /**
   * 平台
   */
  Platform: string
  /**
   * 服务器ID
   */
  GuildId: string
  /**
   * 频道ID
   */
  ChannelId: string
  /**
   * 消息类型
   */
  IsMaster: boolean
  /**
   * 消息内容
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
   * 消息ID
   */
  MsgId: string
  /**
   * 消息内容
   */
  Megs: any[]
  /**
   * 消息内容
   */
  OpenID: string
  /**
   * 创建时间
   */
  CreateAt: number
  /**
   * 标记
   */
  tag: string
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
export type AEventByPrivateMessageCreate = {
  /**
   * 平台
   */
  Platform: string
  /**
   * 消息类型
   */
  IsMaster: boolean
  /**
   * 消息内容
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
   * 消息ID
   */
  MsgId: string
  /**
   * 消息内容
   */
  Megs: any[]
  /**
   * 创建时间
   */
  CreateAt: number
  /**
   * 捕获原始消息格式
   */
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
  'private.message.create': AEventByPrivateMessageCreate
}

declare global {
  var logger: {
    /**
     *痕迹
     * @param arg
     */
    trace(...arg: LogType[]): any
    /**
     *调试
     * @param arg
     */
    debug(...arg: LogType[]): any
    /**
     *信息
     * @param arg
     */
    info(...arg: LogType[]): any
    /**
     *警告
     * @param arg
     */
    warn(...arg: LogType[]): any
    /**
     *错误
     * @param arg
     */
    error(...arg: LogType[]): any
    /**
     *致命
     * @param arg
     */
    fatal(...arg: LogType[]): any
    /**
     *标记
     * @param arg
     */
    mark(...arg: LogType[]): any
  }
}
