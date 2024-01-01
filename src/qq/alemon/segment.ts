import { BUFFER } from '../../core/utils/index.js'
export const segmentQQ = {
  at: (uid: string): string => {
    return `<@!${uid}>`
  },
  atAll: (): string => {
    return `@everyone`
  },
  img: BUFFER.getPath,
  qrcode: BUFFER.qrcode,
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
  }
}
