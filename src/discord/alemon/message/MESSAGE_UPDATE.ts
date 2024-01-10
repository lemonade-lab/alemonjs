interface MESSAGE_UPDATE_TYPE {
  type: number
  tts: boolean
  timestamp: string
  pinned: boolean
  mentions: any[]
  mention_roles: string[]
  mention_everyone: boolean
  member: {
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
  id: string
  flags: number
  embeds: {
    type: string
    title: string
    image: any
    description: ''
    color: number
  }[]
  edited_timestamp: string
  content: string
  components: { type: number; components: any }[]
  channel_id: string
  author: {
    username: string
    public_flags: number
    premium_type: number
    id: string
    global_name: null
    discriminator: string
    bot: true
    avatar_decoration_data: null
    avatar: string
  }
  attachments: any[]
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function MESSAGE_UPDATE(event: MESSAGE_UPDATE_TYPE) {}
