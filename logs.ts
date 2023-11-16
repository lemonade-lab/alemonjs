/**
 * 重定义log
 * @param fun 中间值
 * @param prefix 前缀
 */
export function setLog(fun: (...args: any[]) => any) {
  const log = console.log
  global.console.log = (...argv: any[]) => {
    log(fun(), ...argv)
  }
  const info = console.info
  global.console.info = (...argv: any[]) => {
    info(fun(), ...argv)
  }
  const error = console.error
  global.console.error = (...argv: any[]) => {
    error(fun(), ...argv)
  }
  const debug = console.debug
  global.console.debug = (...argv: any[]) => {
    debug(fun(), ...argv)
  }
}
