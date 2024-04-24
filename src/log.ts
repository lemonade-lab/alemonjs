function prefix() {
  return `[${new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  })}]`
}
class Loger {
  log(...argv: any[]) {
    return console.log(prefix(), ...argv)
  }
  info(...argv: any[]) {
    return console.info(prefix(), ...argv)
  }
  error(...argv: any[]) {
    return console.error(prefix(), ...argv)
  }
  debug(...argv: any[]) {
    return console.debug(prefix(), ...argv)
  }
}
export const loger =
  process.env.NODE_ENV != 'production' ? new Loger() : console
