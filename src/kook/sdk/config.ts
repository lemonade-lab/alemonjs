import { BaseConfig } from '../../core/index.js'
export interface ClientConfig {
  token: string
}
export const config = new BaseConfig<ClientConfig>({
  token: ''
})
