import { getPathBuffer } from '../../core/buffer.js'
export const segmentVILLA = {
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
   * 子频道引用
   * @param channel_id
   * @returns
   */
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
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
