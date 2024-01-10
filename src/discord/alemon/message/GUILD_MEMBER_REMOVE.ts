interface GUILD_MEMBER_REMOVE_TYPE {
  user: {
    username: string
    public_flags: number
    id: string
    global_name: string
    discriminator: string
    avatar_decoration_data: null
    avatar: string
  }
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function GUILD_MEMBER_REMOVE(event: GUILD_MEMBER_REMOVE_TYPE) {}
