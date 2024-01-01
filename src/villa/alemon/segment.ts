import { getPathBuffer, createQrcode } from '../../core/utils/index.js'
export const segmentVILLA = {
  img: getPathBuffer,
  qrcode: createQrcode,
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  at: (uid: string): string => {
    return `<@${uid}>`
  },
  atAll: (): string => {
    return `<@everyone>`
  },
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
  },
  link: (name: string, url: string): string => {
    return `[${name}](${url})`
  }
}
