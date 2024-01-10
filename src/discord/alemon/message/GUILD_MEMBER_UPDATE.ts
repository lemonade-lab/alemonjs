interface GUILD_MEMBER_UPDATE_TYPE {
  user: {
    username: string
    public_flags: number
    id: string
    global_name: string
    display_name: string
    discriminator: string
    bot: boolean
    avatar_decoration_data: {
      sku_id: string
      asset: string
    }
    avatar: string
  }
  roles: string[]
  premium_since: null
  pending: boolean
  nick: null
  mute: boolean
  joined_at: string
  guild_id: string
  flags: number
  deaf: boolean
  communication_disabled_until: null
  avatar: null
}

/**
 * 基础消息
 * @param event
 */
export async function GUILD_MEMBER_UPDATE(event: GUILD_MEMBER_UPDATE_TYPE) {}
