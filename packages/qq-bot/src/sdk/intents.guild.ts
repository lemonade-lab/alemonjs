/**
 * 订阅枚举
 */
export const AvailableIntentsEventsEnum = [
  'GUILDS',
  'MEMBERS',
  'GUILD_MESSAGES',
  'REACTIONS',
  'DIRECT_MESSAGE',
  'FORUMS_EVENT',
  'AUDIO_ACTION',
  'PUBLIC_GUILD_MESSAGES',
  'MESSAGE_AUDIT',
  'INTERACTION'
] as const

/**
 * 订阅枚举
 */
export type IntentsGuildEnum = (typeof AvailableIntentsEventsEnum)[number]

const intentsMap = {
  GUILDS: 1 << 0,
  MEMBERS: 1 << 1,
  GUILD_MESSAGES: 1 << 9,
  REACTIONS: 1 << 10,
  DIRECT_MESSAGE: 1 << 12,
  OPEN_FORUMS_EVENT: 1 << 18,
  AUDIO_OR_LIVE_CHANNEL_MEMBER: 1 << 19,
  INTERACTION: 1 << 26,
  MESSAGE_AUDIT: 1 << 27,
  FORUMS_EVENT: 1 << 28,
  AUDIO_ACTION: 1 << 29,
  PUBLIC_GUILD_MESSAGES: 1 << 30
}

export function getIntentsMask(intents: IntentsGuildEnum[]) {
  let intentsMask = 0
  for (const item of intents) {
    const mask = intentsMap[item]
    if (mask) {
      intentsMask |= mask
    }
  }
  return intentsMask
}
