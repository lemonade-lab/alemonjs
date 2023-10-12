import { GatewayIntentBits } from 'discord.js'
export default {
  token: '',
  masterID: '',
  password: '',
  intents: [
    8_192, 16_384, 4_096, 1_024, 2_048, 512, 1, 32_768
  ] as GatewayIntentBits[]
}
