import { ABuffer, type SegmentType } from '../../../core/index.js'
export const segmentQQ: SegmentType = {
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
  },
  link: (txt: string, url: string): string => url,
  role: (role_id: string): string => '',
  spoiler: (content: string): string => content,
  expression: (name: string, id: string): string => '',
  Bold: (txt: string): string => txt,
  italic: (txt: string): string => txt,
  boldItalic: (txt: string): string => txt,
  strikethrough: (txt: string): string => txt,
  block: (txt: string): string => txt
}
