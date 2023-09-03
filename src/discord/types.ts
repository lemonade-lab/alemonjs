import { GatewayIntentBits } from 'discord.js'
export interface LoginConfigByDiscord {
  token: string
  intents: GatewayIntentBits[]
  masterID?: string
  password?: string
}
