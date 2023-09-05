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
   *
   * @param role_id 角色
   */
  role: function (role_id: string): string {
    return `(rol)${role_id}(rol)`
  },
  /**
   *  点击后才显示
   * @param content 内容
   */
  spoiler: function (content: string): string {
    return ``
  },
  /**
   *
   * @param name  服务器表情名
   * @param id   服务器表情id
   */
  expression: function (name: string, id: string): string {
    return `(emj)${name}(emj)[${id}]`
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
   * 加粗斜体
   */
  boldItalic: function (txt: string): string {
    return `***${txt}***`
  },
  /**
   * 删除线
   * @param txt
   */
  strikethrough: function (txt: string): string {
    return `~~${txt}~~`
  },
  /**
   * 代码块
   * @param txt
   */
  block: function (txt: string): string {
    return `\`${txt}\``
  }
}
