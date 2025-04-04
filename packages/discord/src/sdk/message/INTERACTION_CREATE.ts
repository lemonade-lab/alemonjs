interface User {
  username: string
  public_flags: number
  primary_guild: null
  id: string
  global_name: string | null
  discriminator: string
  collectibles: null
  clan: null
  avatar_decoration_data: null
  avatar: string
}

type Message = {
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
  author: User
  attachments: unknown[]
}

type Member = {
  user: User
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

type DiscordGuild = {
  locale: string
  id: string
  features: string[]
}

type PublicChannel = {
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

interface Channel {
  type: number
  recipients: any[]
  recipient_flags: number
  last_message_id: string
  id: string
  flags: number
}

interface Data {
  id: number
  custom_id: string
  component_type: number
}

type Public = {
  version: number
  type: number
  token: string
  member: Member
  message: Message
  locale: string
  id: string
  guild_locale: string
  guild_id: string
  guild: DiscordGuild
  entitlement_sku_ids: any[]
  entitlements: any[]
  data: Data
  context: number
  channel_id: string
  channel: PublicChannel
  authorizing_integration_owners: Record<string, string>
  attachment_size_limit: number
  application_id: string
  app_permissions: string
}

type Private = {
  version: number
  type: number
  token: string
  user: User
  message: Message
  locale: string
  id: string
  entitlements: any[]
  data: Data
  context: number
  channel_id: string
  channel: Channel
  authorizing_integration_owners: Record<string, string>
  attachment_size_limit: number
  application_id: string
  app_permissions: string
}

export type INTERACTION_CREATE_TYPE = Public | Private
