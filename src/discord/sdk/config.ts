interface ClientConfig {
  token: string
  intent: number
}

const cfg = {
  token: '',
  intent: 0
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
