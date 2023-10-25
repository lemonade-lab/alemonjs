export const segmentQQ = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: (uid: string): string => {
    // 暂时用户@
    return '' // 没有艾特了
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: (): string => {
    return '@everyone'
  },
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
    return '' // 没有
  },
  link: (title: string, centent): string => {
    return `[🔗${title}](${centent})`
  }
}
