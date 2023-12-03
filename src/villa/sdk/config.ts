import { type ClientConfig } from './types.js'
const cfg: ClientConfig = {
  bot_id: '',
  bot_secret: '',
  pub_key: '',
  villa_id: 0,
  token: ''
}

/**
 *
 * @param key
 * @param val
 */
export function setBotConfig<T extends keyof ClientConfig>(
  key: T,
  val: ClientConfig[T]
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
export function getBotConfig<T extends keyof ClientConfig>(
  key: T
): ClientConfig[T] | undefined {
  return cfg[key]
}
