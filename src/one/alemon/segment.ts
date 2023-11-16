import { getPathBuffer } from '../../core/buffer.js'
export const segmentONE = {
  at: (uid: string): string => {
    return `<@${uid}>`
  },
  atAll: (): string => {
    return `<@everyone>`
  },
  img: getPathBuffer,
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  link: (name: string, url: string): string => {
    return `[${name}](${url})`
  }
}
