export const segmentKOOK = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: function (uid: string): string {
    return `(met)${uid}(met)`
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: function atAll(): string {
    return `(met)all(met)`
  },
  /**
   * 子频道引用
   * @param channel_id
   * @returns
   */
  atChannel: function (channel_id: string): string {
    return `(chn)${channel_id}(chn)`
  }
}
