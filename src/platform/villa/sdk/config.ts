import { BaseConfig } from '../../../core/index.js'
export interface ClientConfig {
  bot_id: string
  bot_secret: string
  pub_key: string
  villa_id: number
  token?: string
}
export const config = new BaseConfig<ClientConfig>({
  bot_id: '',
  bot_secret: '',
  pub_key: '',
  villa_id: 0,
  token: ''
})
