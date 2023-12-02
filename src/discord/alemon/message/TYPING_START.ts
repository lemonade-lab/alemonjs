interface TYPING_START_TYPE {
  user_id: string
  timestamp: number
  member: {
    user: {
      username: string
      public_flags: number
      id: string
      global_name: string
      display_name: string
      discriminator: string
      bot: boolean
      avatar_decoration_data: null
      avatar: string
    }
    roles: string[]
    premium_since: string
    pending: boolean
    nick: string
    mute: boolean
    joined_at: string
    flags: number
    deaf: boolean
    communication_disabled_until: null
    avatar: null
  }
  channel_id: string
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function TYPING_START(event: TYPING_START_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
}
