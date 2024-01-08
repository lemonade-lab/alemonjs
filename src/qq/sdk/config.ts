import { IntentsEnum } from './typings.js'

export interface ClientConfig {
  appID: string
  token: string
  secret: string
  intents: IntentsEnum[]
  sandbox: boolean
}

class Config {
  #data: ClientConfig = {
    appID: '',
    token: '',
    secret: '',
    intents: [],
    sandbox: false
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
