export type Guild = {
  /**
   * 频道Id
   */
  GuildId: string
  /**
   * 频道名
   */
  GuildIdName?: string
  /**
   * 频道头像
   */
  GuildIdAvatar?: {
    toURL: () => Promise<string>
    toBase64: () => Promise<string>
    toBuffer: () => Promise<Buffer>
  }
}

export type Channel = {
  /**
   * 子频道Id
   */
  ChannelId: string
  /**
   * 子频道名
   */
  ChannelName?: string
  /**
   *
   */
  ChannelAvatar?: {
    toURL: () => Promise<string>
    toBase64: () => Promise<string>
    toBuffer: () => Promise<Buffer>
  }
}
