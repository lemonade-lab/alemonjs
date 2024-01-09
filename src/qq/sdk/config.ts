import { IntentsEnum } from './typings.js'
import { BaseConfig } from '../../core/index.js'

export interface ClientConfig {
  appID: string
  token: string
  secret: string
  intents: IntentsEnum[]
  sandbox: boolean
  shard?: number[]
}

export const config = new BaseConfig<ClientConfig>({
  appID: '',
  token: '',
  secret: '',
  intents: [],
  sandbox: false,
  shard: [0, 1]
})
