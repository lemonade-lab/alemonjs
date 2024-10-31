/**
 *
 */
export const DCSegment = {
  /**
   *
   * @param uid
   * @returns
   */
  at(uid: string) {
    return `<@${uid}>`
  },

  /**
   *
   * @returns
   */
  atAll() {
    return `@everyone`
  },

  /**
   *
   * @param url
   * @returns
   */
  http(url: string) {
    return `<http>${url}</http>`
  },

  /**
   *
   * @param channel_id
   * @returns
   */
  atChannel(channel_id: string) {
    return `<#${channel_id}>`
  },

  /**
   *
   * @param name
   * @param url
   * @returns
   */
  link(name: string, url: string): string {
    return `[${name}](${url})`
  },

  /**
   *
   * @param txt
   * @returns
   */
  block(txt: string) {
    return `\`${txt}\``
  },

  /**
   *
   * @param txt
   * @returns
   */
  Bold(txt: string) {
    return `**${txt}**`
  },

  /**
   *
   * @param txt
   * @returns
   */
  italic(txt: string): string {
    return `*${txt}*`
  },

  /**
   *
   * @param txt
   * @returns
   */
  strikethrough(txt: string): string {
    return `~~${txt}~~`
  }
}
