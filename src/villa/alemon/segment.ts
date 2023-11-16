import { getPathBuffer } from '../../core/buffer.js'
export const segmentVILLA = {
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
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
  },
  link: (name: string, url: string): string => {
    return `[${name}](${url})`
  }
}
