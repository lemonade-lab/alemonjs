interface MESSAGE_REACTION_ADD_TYPE {
  user_id: string
  type: number
  message_id: string
  message_author_id: string
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
    premium_since: null
    pending: boolean
    nick: null
    mute: boolean
    joined_at: string
    flags: number
    deaf: boolean
    communication_disabled_until: null
    avatar: null
  }
  emoji: { name: string; id: string }
  channel_id: string
  burst: boolean
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function MESSAGE_REACTION_ADD(event: MESSAGE_REACTION_ADD_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
}
