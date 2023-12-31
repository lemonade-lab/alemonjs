import { getPathBuffer } from '../../core/utils/buffer.js'
import { createQrcode } from '../../core/utils/qrcode.js'
export const segmentQQ = {
  at: (uid: string): string => {
    return `<@!${uid}>`
  },
  atAll: (): string => {
    return `@everyone`
  },
  img: getPathBuffer,
  qrcode: createQrcode,
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
  }
}
