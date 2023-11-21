import { getPathBuffer } from '../../../core/buffer.js'
export const segmentNTQQ = {
  at: (uid: string): string => {
    return `<@${uid}>`
  },
  atAll: (): string => {
    return '@everyone'
  },
  img: getPathBuffer,
  http: (url: string) => {
    return `<http>${url}</http>`
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
