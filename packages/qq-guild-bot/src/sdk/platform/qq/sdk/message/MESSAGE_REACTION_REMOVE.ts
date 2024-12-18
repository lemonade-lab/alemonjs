export type MESSAGE_REACTION_REMOVE_TYPE = {
  channel_id: string
  emoji: { id: string; type: number }
  guild_id: string
  target: {
    id: string
    type: string
  }
  user_id: string
}
