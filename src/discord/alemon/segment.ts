export const segmentDiscord = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: function (uid: string): string {
    return `<@${uid}>`
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: function atAll(): string {
    return `@everyone`
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
  },
  /**
   * 代码块
   * @param txt
   */
  block: function (txt: string): string {
    return `\`${txt}\``
  },
  /**
   * 加粗
   * @param txt
   */
  Bold: function (txt: string): string {
    return `**${txt}**`
  },
  /**
   * 斜体
   * @param txt
   */
  italic: function (txt: string): string {
    return `*${txt}*`
  },
  /**
   * 删除线
   * @param txt
   */
  strikethrough: function (txt: string): string {
    return `~~${txt}~~`
  }
}
