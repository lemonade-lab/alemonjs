import { BaseConfig } from '../../../core/index.js'
export interface ClientConfig {
  token: string
  intent: number
  shard?: number[]
}
export const config = new BaseConfig<ClientConfig>({
  token: '',
  intent: 0,
  shard: [0, 1]
})
