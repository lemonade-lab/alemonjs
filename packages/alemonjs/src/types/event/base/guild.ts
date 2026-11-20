export type Guild = {
  /**
   * 频道Id
   */
  GuildId: string;
  /** 平台提供的跨应用关联群 ID */
  UnionGuildId?: string;
  /**
   * 空间Id
   */
  SpaceId: string;
};

export type Channel = {
  /**
   * 子频道Id
   */
  ChannelId: string;
};
