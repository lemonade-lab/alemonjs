import { ABuffer, type SegmentType } from '../../../core/index.js'
export const segmentDISCORD: SegmentType = {
  at: function (uid: string): string {
    return `<@${uid}>`
  },
  atAll: function atAll(): string {
    return `@everyone`
  },
  img: ABuffer.getPath,
  qrcode: ABuffer.qrcode,
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
  },
  role: (role_id: string): string => '',
  spoiler: (content: string): string => content,
  expression: (name: string, id: string): string => '',
  boldItalic: (txt: string): string => txt
}
