export const segmentVilla = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: function (uid: string): string {
    return `<@!${uid}>`
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: function atAll(): string {
    return `<@!everyone>`
  },
  /**
   * 子频道引用
   * @param channel_id
   * @returns
   */
  atChannel: function (channel_id: string): string {
    return `<#${channel_id}>`
  },
  /**
   * 蓝链接
   * @param name
   * @param url
   * @returns
   */
  link: function (name: string, url: string): string {
    return `[${name}](${url})`
  }
}
