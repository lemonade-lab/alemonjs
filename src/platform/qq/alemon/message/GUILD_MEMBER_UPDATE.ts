import {
  APPS,
  type TypingEnum,
  type EventEnum
} from '../../../../core/index.js'
import { segmentQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'

/**
 * 当成员资料变更时
 * @param event
 * @returns
 */
export const GUILD_MEMBER_UPDATE = async (event: {
  guild_id: string
  joined_at: string
  nick: string
  op_user_id: string
  roles: string[]
  source_type?: string // 加入时就会有
  user: {
    avatar: string
    bot: number
    id: string
    username: string
  }
}) => {
  const cfg = ABotConfig.get('qq')
  const masterID = cfg.masterID

  const e = {
    platform: 'qq',
    event: 'MEMBERS' as (typeof EventEnum)[number],
    typing: 'UPDATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.user.id)
      : masterID == event.user.id,
    attachments: [],
    specials: [],
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    quote: '',
    open_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_txt: '',
    msg_id: event.guild_id,
    //
    user_id: event.user.id,
    user_name: event.user.username,
    user_avatar: event.user.avatar,
    segment: segmentQQ,
    send_at: new Date(event.joined_at).getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
