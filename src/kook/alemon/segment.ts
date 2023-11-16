import { getPathBuffer } from '../../core/buffer.js'
export const segmentKOOK = {
  at: (uid: string): string => {
    return `(met)${uid}(met)`
  },
  atAll: (): string => {
    return `(met)all(met)`
  },
  img: getPathBuffer,
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  link: (name: string, url: string): string => {
    return `[${name}](${url})`
  },
  atChannel: (channel_id: string): string => {
    return `(chn)${channel_id}(chn)`
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
