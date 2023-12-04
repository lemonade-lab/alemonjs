import { IntentsEnum } from './typings.js'
export interface ClientConfig {
  appID: string
  token: string
  secret: string
  intents: IntentsEnum[]
  sandbox: boolean
}
const cfg: ClientConfig = {
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
