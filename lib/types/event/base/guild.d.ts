//#region src/types/event/base/guild.d.ts
type Guild = {
  /**
   * 频道Id
   */
  GuildId: string;
  /**
   * 空间Id
   */
  SpaceId: string;
};
type Channel = {
  /**
   * 子频道Id
   */
  ChannelId: string;
};
//#endregion
export { Channel, Guild };