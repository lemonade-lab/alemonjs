export interface ClientConfig {
  token: string
}

class Config {
  #data: ClientConfig = {
    token: ''
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
