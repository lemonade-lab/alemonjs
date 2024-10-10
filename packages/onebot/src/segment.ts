export const segmentONE = {
  at: uid => {
    return `<@${uid}>`
  },
  atAll: () => {
    return `<@everyone>`
  },
  http: url => {
    return `<http>${url}</http>`
  },
  link: (name, url) => {
    return `[${name}](${url})`
  }
}
