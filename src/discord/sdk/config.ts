import { BaseConfig } from '../../core/index.js'
export interface ClientConfig {
  token: string
  intent: number
  BaseUrl?: string
}
export const config = new BaseConfig<ClientConfig>({
  token: '',
  intent: 0,
  BaseUrl: 'https://cdn.discordapp.com'
})
