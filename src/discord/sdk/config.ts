export interface ClientConfig {
  token: string
  intent: number
}

class Config {
  #data: ClientConfig = {
    token: '',
    intent: 0
  }
  set<T extends keyof ClientConfig>(key: T, val: ClientConfig[T]): void {
    if (Object.prototype.hasOwnProperty.call(this.#data, key)) {
      this.#data[key] = val
    }
  }
  get<T extends keyof ClientConfig>(key: T): ClientConfig[T] | undefined {
    return this.#data[key]
  }
}

export const config = new Config()
