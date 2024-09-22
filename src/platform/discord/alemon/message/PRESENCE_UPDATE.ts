import { type EventEnum, type TypingEnum } from '../../../../core/index.js'
import { APPS } from '../../../../core/index.js'
import { BotMessage } from '../bot.js'

/**
 * 表态 更新
 * @param event
 */
export async function PRESENCE_UPDATE(event: {
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
}) {
  // const masterID = ABotConfig.get('discord').masterID

  const e = {
    platform: 'qq',
    event: 'REACTIONS' as (typeof EventEnum)[number],
    typing: 'UPDATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: '',
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: '',
    user_id: '',
    user_name: '',
    user_avatar: '',
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
