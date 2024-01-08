import { BaseConfig } from '../../core/index.js'
export interface ClientConfig {
  token: string
  intent: number
}
export const config = new BaseConfig<ClientConfig>({
  token: '',
  intent: 0
})
