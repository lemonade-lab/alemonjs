import { BotConfig } from './typings.js'
const cfg: BotConfig = {
  appID: '',
  token: '',
  secret: '',
  intents: [],
  sandbox: false
}

/**
 *
 * @param key
 * @param val
 */
export function setBotConfig<T extends keyof BotConfig>(
  key: T,
  val: BotConfig[T]
): void {
  if (Object.prototype.hasOwnProperty.call(cfg, key)) {
    cfg[key] = val
  }
}
/**
 *
 * @param key
 * @returns
 */
export function getBotConfig<T extends keyof BotConfig>(
  key: T
): BotConfig[T] | undefined {
  return cfg[key]
}
