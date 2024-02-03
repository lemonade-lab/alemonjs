import { ABuffer, type SegmentType } from '../../../core/index.js'
export const segmentVILLA: SegmentType = {
  img: ABuffer.getPath,
  qrcode: ABuffer.qrcode,
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
  },
  role: (role_id: string): string => '',
  spoiler: (content: string): string => content,
  expression: (name: string, id: string): string => '',
  Bold: (txt: string): string => txt,
  italic: (txt: string): string => txt,
  boldItalic: (txt: string): string => txt,
  strikethrough: (txt: string): string => txt,
  block: (txt: string): string => txt
}
