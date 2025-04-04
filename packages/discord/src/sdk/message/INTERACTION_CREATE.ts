type DiscordMessage = {
  type: number
  tts: boolean
  timestamp: string
  pinned: boolean
  mentions: unknown[]
  mention_roles: unknown[]
  mention_everyone: boolean
  id: string
  flags: number
  embeds: unknown[]
  edited_timestamp: string | null
  content: string
  components: unknown[]
  channel_id: string
  author: DiscordUser
  attachments: unknown[]
}

type DiscordMember = {
  user: DiscordUser
  unusual_dm_activity_until: string | null
  roles: string[]
  premium_since: string | null
  permissions: string
  pending: boolean
  nick: string | null
  mute: boolean
  joined_at: string
  flags: number
  deaf: boolean
  communication_disabled_until: string | null
  banner: string | null
  avatar: string | null
}

type DiscordUser = {
  username: string
  public_flags: number
  primary_guild: string | null
  id: string
  global_name: string | null
  discriminator: string
  collectibles: unknown | null
  clan: unknown | null
  bot: boolean
  avatar_decoration_data: unknown | null
  avatar: string
}

type DiscordGuild = {
  locale: string
  id: string
  features: string[]
}

type DiscordChannel = {
  type: number
  topic: string | null
  theme_color: number | null
  rate_limit_per_user: number
  position: number
  permissions: string
  parent_id: string
  nsfw: boolean
  name: string
  last_message_id: string
  id: string
  icon_emoji: {
    name: string
    id: string | null
  }
  guild_id: string
  flags: number
}

export type INTERACTION_CREATE_TYPE = {
  version: number
  type: number
  token: string
  message: DiscordMessage
  member: DiscordMember
  locale: string
  id: string
  guild_locale: string
  guild_id: string
  guild: DiscordGuild
  entitlements: unknown[]
  entitlement_sku_ids: unknown[]
  data: {
    id: number
    custom_id: string
    component_type: number
  }
  context: number
  channel_id: string
  channel: DiscordChannel
  authorizing_integration_owners: Record<string, string>
  attachment_size_limit: number
  application_id: string
  app_permissions: string
}
