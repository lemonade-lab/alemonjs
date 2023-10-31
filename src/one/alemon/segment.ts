import { getPathBuffer } from '../../core/buffer.js'
export const segmentONE = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: (uid: string): string => {
    return `<@${uid}>`
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: (): string => {
    return `<@everyone>`
  },
  img: getPathBuffer,
  /**
   * 标注GET请求
   * @returns
   */
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  /**
   * 蓝链接
   * @param name
   * @param url
   * @returns
   */
  link: (name: string, url: string): string => {
    return `[${name}](${url})`
  }
}
