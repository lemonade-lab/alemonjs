import { BaseConfig } from '../../../core/config.js'
import { DCIntentsEnum } from './types.js'
export const config = new BaseConfig<{
  token: string
  intent: DCIntentsEnum[]
  shard?: number[]
}>({
  token: '',
  intent: [
    'MESSAGE_CONTENT', // 内容是基础
    //
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_TYPING',
    'DIRECT_MESSAGE_REACTIONS',
    //
    'GUILDS',
    'GUILD_MESSAGE_TYPING',
    'REACTIONS',
    'GUILD_MESSAGES',
    'MEMBERS',
    //
    'GUILD_MODERATION',
    'GUILD_EMOJIS_AND_STICKERS',
    'GUILD_INTEGRATIONS',
    'GUILD_WEBHOOKS',
    'GUILD_INVITES',
    'GUILD_VOICE_STATES',
    'GUILD_PRESENCES'
  ],
  shard: [0, 1]
})
