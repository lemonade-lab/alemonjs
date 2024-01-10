interface VOICE_CHANNEL_STATUS_UPDATE_TYPE {
  status: null
  id: string
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function VOICE_CHANNEL_STATUS_UPDATE(
  event: VOICE_CHANNEL_STATUS_UPDATE_TYPE
) {}
