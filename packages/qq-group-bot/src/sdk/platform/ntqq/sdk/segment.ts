export const QQBotGroupSegment = {
  at: (uid: string): string => {
    return `<@${uid}>`
  },
  atAll: (): string => {
    return '@everyone'
  },
  http: (url: string) => {
    return `<http>${url}</http>`
  },
  link: (title: string, centent): string => {
    return `[🔗${title}](${centent})`
  }
}
