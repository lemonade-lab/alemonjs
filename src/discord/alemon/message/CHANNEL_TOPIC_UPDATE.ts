interface CHANNEL_TOPIC_UPDATE_TYPE {
  topic: null
  id: string
  guild_id: string
}

/**
 * 基础消息
 * @param event
 */
export async function CHANNEL_TOPIC_UPDATE(event: CHANNEL_TOPIC_UPDATE_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
}
