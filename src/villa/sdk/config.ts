export interface ClientConfig {
  bot_id: string
  bot_secret: string
  pub_key: string
  villa_id?: number
  token: string
}

class Config {
  #data: ClientConfig = {
    bot_id: '',
    bot_secret: '',
    pub_key: '',
    villa_id: 0,
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
