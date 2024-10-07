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
export type QQBotGuildIntentsEnum = (typeof AvailableIntentsEventsEnum)[number]
