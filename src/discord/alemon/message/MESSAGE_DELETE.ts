interface MESSAGE_DELETE_TYPE {
  id: string
  channel_id: string
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function MESSAGE_DELETE(event: MESSAGE_DELETE_TYPE) {}
