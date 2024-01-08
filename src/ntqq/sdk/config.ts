import { BaseConfig } from '../../core/index.js'
export interface ClientConfig {
  appID: string
  token: string
  secret: string
  intents: number
  isPrivate?: boolean
  sandbox?: boolean
  shard?: number[]
}
export const config = new BaseConfig<ClientConfig>({
  appID: '',
  token: '',
  secret: '',
  intents: 0,
  isPrivate: false,
  sandbox: false,
  shard: [0, 1]
})
