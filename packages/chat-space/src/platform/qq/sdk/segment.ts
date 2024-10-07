/**
 *
 */
export const QQBotGuildSegment = {
  at: (uid: string): string => {
    return `<@!${uid}>`
  },
  atAll: (): string => {
    return `@everyone`
  },
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  atChannel: (channel_id: string): string => {
    return `<#${channel_id}>`
  }
}
