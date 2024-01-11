import { ABuffer } from '../../core/utils/index.js'
export const segmentQQ = {
  at: (uid: string): string => {
    return `<@!${uid}>`
  },
  atAll: (): string => {
    return `@everyone`
  },
  img: ABuffer.getPath,
  qrcode: ABuffer.qrcode,
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
  }
}
