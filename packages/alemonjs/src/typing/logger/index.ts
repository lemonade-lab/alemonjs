/**
 * Logger interface
 */
export type LoggerUtils = {
  /**
   *  trace
   * @param args
   * @returns
   */
  trace: (...args: any[]) => void
  /**
   *  debug
   * @param args
   * @returns
   */
  debug: (...args: any[]) => void
  /**
   *  info
   * @param args
   * @returns
   */
  info: (...args: any[]) => void
  /**
   *  warn
   * @param args
   * @returns
   */
  warn: (...args: any[]) => void
  /**
   *  error
   * @param args
   * @returns
   */
  error: (...args: any[]) => void
  /**
   *  fatal
   * @param args
   * @returns
   */
  fatal: (...args: any[]) => void
  /**
   *  mark
   * @param args
   * @returns
   */
  mark: (...args: any[]) => void
}
