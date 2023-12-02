interface CHANNEL_UPDATE_TYPE {
  version: number
  user_limit: number
  type: number
  rtc_region: null
  rate_limit_per_user: number
  position: number
  permission_overwrites: [
    { type: number; id: string; deny: string; allow: string },
    {
      type: number
      id: string
      deny: string
      allow: string
    },
    { type: number; id: string; deny: string; allow: string },
    { type: number; id: string; deny: string; allow: string }
  ]
  parent_id: null
  nsfw: false
  name: string
  last_message_id: null
  id: string
  guild_id: string
  flags: number
  bitrate: number
}

/**
 * 基础消息
 * @param event
 */
export async function CHANNEL_UPDATE(event: CHANNEL_UPDATE_TYPE) {
  if (process.env?.ALEMONJS_EVENT == 'dev') console.info('event', event)
}
