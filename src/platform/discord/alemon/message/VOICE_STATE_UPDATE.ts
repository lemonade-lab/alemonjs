import { type EventEnum, type TypingEnum } from '../../../../core/index.js'
import { APPS } from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { ClientDISOCRD } from '../../sdk/index.js'

/**
 * 音频状态更新
 * @param event
 */
export async function VOICE_STATE_UPDATE(event: {
  member: {
    user: {
      username: string
      public_flags: number
      id: string
      global_name: string
      display_name: string
      discriminator: string
      bot: boolean
      avatar_decoration_data: any
      avatar: string
    }
    roles: string[]
    premium_since: null
    pending: boolean
    nick: null
    mute: boolean
    joined_at: string
    flags: number
    deaf: boolean
    communication_disabled_until: null
    avatar: string
  }
  user_id: string
  suppress: boolean
  session_id: string
  self_video: boolean
  self_mute: true
  self_deaf: boolean
  request_to_speak_timestamp: null
  mute: boolean
  guild_id: string
  deaf: boolean
  channel_id: string
}) {
  // const masterID = ABotConfig.get('discord').masterID

  const e = {
    platform: 'qq',
    event: 'FREQUENCY' as (typeof EventEnum)[number],
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

    //
    user_id: event.member.user.id,
    user_name: event.member.user.username,
    user_avatar: ClientDISOCRD.userAvatar(
      event.member.user.id,
      event.member.user.avatar
    ),
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
