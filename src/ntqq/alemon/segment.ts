import { getPathBuffer } from '../../core/buffer.js'
export const segmentNTQQ = {
  /**
   * 艾特某人
   * @param uid
   * @returns
   */
  at: (uid: string): string => {
    // 暂时用户@
    return `<@${uid}>`
  },
  /**
   * 艾特全体
   * @returns
   */
  atAll: (): string => {
    return '@everyone'
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
    return '' // 没有
  },
  link: (title: string, centent): string => {
    return `[🔗${title}](${centent})`
  }
}

// 标题
//  加粗
// 下划线加粗
//  斜体
// 星号斜体
// 加粗斜体
// 删除线
// 块引用
