export interface ClientConfig {
  appID: string
  token: string
  secret: string
  intents: number
  isPrivate?: boolean
  sandbox?: boolean
  shard?: number[]
}
// 机器人缓存配置
const cfg: ClientConfig = {
  appID: '',
  token: '',
  secret: '',
  intents: 0,
  isPrivate: false,
  sandbox: false,
  shard: [0, 1]
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
