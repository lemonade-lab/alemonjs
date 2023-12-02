interface GUILD_MEMBER_ADD_TYPE {
  user: {
    username: string
    public_flags: number
    id: string
    global_name: string
    discriminator: string
    avatar_decoration_data: null
    avatar: string
  }
  unusual_dm_activity_until: null
  roles: any[]
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
export async function GUILD_MEMBER_ADD(event: GUILD_MEMBER_ADD_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
}
