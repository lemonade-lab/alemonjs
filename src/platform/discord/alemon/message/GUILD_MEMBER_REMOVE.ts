import { type EventEnum, type TypingEnum } from '../../../../core/index.js'
import { APPS } from '../../../../core/index.js'
import { ABotConfig } from '../../../../config/index.js'
import { BotMessage } from '../bot.js'
import { ClientDISOCRD } from '../../sdk/index.js'

/**
 * 频道成员删除
 * @param event
 */
export async function GUILD_MEMBER_REMOVE(event: {
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
}) {
  const masterID = ABotConfig.get('discord').masterID

  const e = {
    platform: 'qq',
    event: 'MEMBERS' as (typeof EventEnum)[number],
    typing: 'DELETE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.user.id)
      : event.user.id == masterID,
    attachments: [],
    specials: [],
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: '',
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: '',
    user_id: event.user.id,
    user_name: event.user.username,
    user_avatar: ClientDISOCRD.userAvatar(event.user?.id, event.user?.avatar),
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
