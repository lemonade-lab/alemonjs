class Loger {
  /**
   * @returns
   */
  prefix() {
    return `[${new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })}]`
  }
  log(...argv: any[]) {
    return console.log(this.prefix(), ...argv)
  }
  info(...argv: any[]) {
    return console.info(this.prefix(), ...argv)
  }
  error(...argv: any[]) {
    return console.error(this.prefix(), ...argv)
  }
  debug(...argv: any[]) {
    return console.debug(this.prefix(), ...argv)
  }
}
export const loger =
  process.env.NODE_ENV != 'production' ? new Loger() : console
