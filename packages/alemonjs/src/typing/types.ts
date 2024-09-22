interface DiscordConfig {
  token: string
  intent: any[]
  master_id: any[]
  shard: any
}

interface KookConfig {
  token: string
  master_id: any[]
}

interface QQGuildConfig {
  app_id: string
  token: string
  master_id: any[]
  intents: any
  is_private: boolean
  shard: any
  sandbox: boolean
}

interface QQGroupConfig {
  app_id: string
  token: string
  secret: string
  master_id: any[]
  intents: any
  shard: any
}
export interface BotConfigType {
  [key: string]: any
  'login': string
  'discord': DiscordConfig
  'kook': KookConfig
  'qq-guild-bot': QQGuildConfig
  'qq-group-bot': QQGroupConfig
}
export * from './typing'
