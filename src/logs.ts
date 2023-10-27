/**
 * 重定义log
 * @param fun 中间值
 * @param prefix 前缀
 */
export function setLog(fun: (...args: any[]) => any, prefix = '[AlemonJS]') {
  const log = console.log
  global.console.log = (...argv: any[]) => {
    log(prefix, `[${fun()}]`, ...argv)
  }
  const info = console.info
  global.console.info = (...argv: any[]) => {
    info(prefix, `[${fun()}]`, ...argv)
  }
  const error = console.error
  global.console.error = (...argv: any[]) => {
    error(prefix, `[${fun()}]`, ...argv)
  }
  const debug = console.debug
  global.console.debug = (...argv: any[]) => {
    debug(prefix, `[${fun()}]`, ...argv)
  }
}
