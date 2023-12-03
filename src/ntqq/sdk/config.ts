export interface BotCaCheType {
  appID: string
  token: string
  secret: string
  intents: number
  isPrivate?: boolean
  sandbox?: boolean
  shard?: number[]
}
// 机器人缓存配置
const cfg: BotCaCheType = {
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
export function setBotConfig<T extends keyof BotCaCheType>(
  key: T,
  val: BotCaCheType[T]
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
export function getBotConfig<T extends keyof BotCaCheType>(
  key: T
): BotCaCheType[T] | undefined {
  return cfg[key]
}
