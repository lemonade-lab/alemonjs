import { getPathBuffer } from '../../core/buffer.js'
export const segmentKOOK = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: (uid: string): string => {
    return `(met)${uid}(met)`
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: (): string => {
    return `(met)all(met)`
  },
  /**
   * 本地图片
   */
  img: getPathBuffer,
  /**
   * 标注GET请求
   * @returns
   */
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  /**
   * 子频道引用
   * @param channel_id
   * @returns
   */
  atChannel: (channel_id: string): string => {
    return `(chn)${channel_id}(chn)`
  },
  /**
   * 蓝链接
   * @param name
   * @param url
   * @returns
   */
  link: (name: string, url: string): string => {
    return `[${name}](${url})`
  },
  /**
   *
   * @param role_id 角色
   */
  role: (role_id: string): string => {
    return `(rol)${role_id}(rol)`
  },
  /**
   *
   * @param name  服务器表情名
   * @param id   服务器表情id
   */
  expression: (name: string, id: string): string => {
    return `(emj)${name}(emj)[${id}]`
  },
  /**
   * 加粗
   * @param txt
   */
  Bold: (txt: string): string => {
    return `**${txt}**`
  },
  /**
   * 斜体
   * @param txt
   */
  italic: (txt: string): string => {
    return `*${txt}*`
  },
  /**
   * 加粗斜体
   */
  boldItalic: (txt: string): string => {
    return `***${txt}***`
  },
  /**
   * 删除线
   * @param txt
   */
  strikethrough: (txt: string): string => {
    return `~~${txt}~~`
  },
  /**
   * 代码块
   * @param txt
   */
  block: (txt: string): string => {
    return `\`${txt}\``
  }
}
