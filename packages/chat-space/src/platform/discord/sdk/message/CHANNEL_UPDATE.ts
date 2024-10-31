/**
 * 子频道更新
 * @param event
 */
export type CHANNEL_UPDATE_TYPE = {
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
