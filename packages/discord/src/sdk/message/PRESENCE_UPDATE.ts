/**
 * 表态 更新
 * @param event
 */
export type PRESENCE_UPDATE_TYPE = {
  user:
    | { id: number }
    | {
        username: string
        public_flags: number
        id: string
        global_name: string
        discriminator: string
        avatar_decoration_data: {
          sku_id: string
          asset: string
        }
        avatar: string
      }
  status: string
  guild_id: string
  client_status: { desktop: string }
  broadcast: null
  activities:
    | {
        type: number
        timestamps: any
        state: string
        name: string
        id: string
        details: string
        created_at: number
        assets: any
        //
        application_id: string
      }[]
    | {
        type: number
        state: string
        name: string
        id: string
        //
        emoji: any
        created_at: number
      }[]
    | {
        type: number
        name: string
        id: string
        created_at: number
      }[]
    | {
        type: number
        timestamps: any
        state: string
        session_id: string
        name: string
        id: string
        details: string
        created_at: number
        buttons: any[]
        assets: any
        application_id: string
      }[]
}
