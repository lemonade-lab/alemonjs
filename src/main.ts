import { AlemonOptions, LoginMap, analysis } from './define/index.js'
/**
 * 配置机器人启动规则
 * @param Options
 */
export function defineConfig<T>(Options?: AlemonOptions & T) {
  if (!Options.env) {
    Options.env = {}
  }
  if (!Options.env?.path) {
    Options.env.path = 'alemon.env'
  }
  return Options
}
/**
 *
 * @param Options
 */
export function ALoginOptions<T>(Options?: LoginMap & T) {
  return analysis(Options) ?? {}
}
