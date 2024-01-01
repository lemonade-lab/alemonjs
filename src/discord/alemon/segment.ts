import { BUFFER } from '../../core/utils/index.js'
export const segmentDISCORD = {
  at: function (uid: string): string {
    return `<@${uid}>`
  },
  atAll: function atAll(): string {
    return `@everyone`
  },
  img: BUFFER.getPath,
  qrcode: BUFFER.qrcode,
  http: (url: string): string => {
    return `<http>${url}</http>`
  },
  atChannel: function (channel_id: string): string {
    return `<#${channel_id}>`
  },
  link: function (name: string, url: string): string {
    return `[${name}](${url})`
  },
  block: function (txt: string): string {
    return `\`${txt}\``
  },
  Bold: function (txt: string): string {
    return `**${txt}**`
  },
  italic: function (txt: string): string {
    return `*${txt}*`
  },
  strikethrough: function (txt: string): string {
    return `~~${txt}~~`
  }
}
