import { ABuffer } from '../../../core/index.js'

/**
 *
 */
export class SegmentDISCORD {
  /**
   *
   * @param uid
   * @returns
   */
  at(uid: string) {
    return `<@${uid}>`
  }

  /**
   *
   * @returns
   */
  atAll() {
    return `@everyone`
  }

  /**
   *
   */
  img = ABuffer.getPath

  /**
   *
   */
  qrcode = ABuffer.qrcode

  /**
   *
   * @param url
   * @returns
   */
  http(url: string) {
    return `<http>${url}</http>`
  }

  /**
   *
   * @param channel_id
   * @returns
   */
  atChannel(channel_id: string) {
    return `<#${channel_id}>`
  }

  /**
   *
   * @param name
   * @param url
   * @returns
   */
  link(name: string, url: string): string {
    return `[${name}](${url})`
  }

  /**
   *
   * @param txt
   * @returns
   */
  block(txt: string) {
    return `\`${txt}\``
  }

  /**
   *
   * @param txt
   * @returns
   */
  Bold(txt: string) {
    return `**${txt}**`
  }

  /**
   *
   * @param txt
   * @returns
   */
  italic(txt: string): string {
    return `*${txt}*`
  }

  /**
   *
   * @param txt
   * @returns
   */
  strikethrough(txt: string): string {
    return `~~${txt}~~`
  }

  /**
   *
   */
  role = (role_id: string): string => ''
  /**
   *
   */
  spoiler = (content: string): string => content

  /**
   *
   * @param name
   * @param id
   * @returns
   */
  expression = (name: string, id: string): string => ''

  /**
   *
   * @param txt
   * @returns
   */
  boldItalic = (txt: string): string => txt
}
