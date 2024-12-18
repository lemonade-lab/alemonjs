import { type DCIntentsEnum } from './types.js'

const DCIntentsMap: {
  [key: string]: number
} = {
  GUILDS: 1,
  MEMBERS: 2,
  GUILD_MODERATION: 4,
  GUILD_EMOJIS_AND_STICKERS: 8,
  GUILD_INTEGRATIONS: 16,
  GUILD_WEBHOOKS: 32,
  GUILD_INVITES: 64,
  GUILD_VOICE_STATES: 128,
  GUILD_PRESENCES: 256,
  GUILD_MESSAGES: 512,
  REACTIONS: 1024,
  GUILD_MESSAGE_TYPING: 2048,
  DIRECT_MESSAGES: 4096,
  DIRECT_MESSAGE_REACTIONS: 8192,
  DIRECT_MESSAGE_TYPING: 16384,
  MESSAGE_CONTENT: 32768,
  GUILD_SCHEDULED_EVENTS: 65536,
  AUTO_MODERATION_CONFIGURATION: 1048576,
  AUTO_MODERATION_EXECUTION: 2097152
}

/**
 *
 * @param intents
 * @returns
 */
export function getIntents(intents: DCIntentsEnum[]) {
  let result = 0
  for (const intent of intents) {
    const i = DCIntentsMap[intent]
    result |= i
  }
  return result
}
