import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { segmentQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'

/**
 * 私信
 * @param event
 * @returns
 */
export const DIRECT_MESSAGE_CREATE = async (event: {
  attachments?: {
    content_type: string
    filename: string
    height: number
    id: string
    size: number
    url: string
    width: number
  }[]
  author: {
    avatar: string
    bot: boolean
    id: string
    username: string
  }
  channel_id: string
  content: string
  direct_message: boolean
  guild_id: string
  id: string
  member: { joined_at: string }
  seq: number
  seq_in_channel: string
  src_guild_id: string
  timestamp: string
}) => {
  const open_id = event?.guild_id

  const masterID = ABotConfig.get('qq').masterID
  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'single' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event?.author?.id)
      : event.author.id == masterID,
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.channel_id,
    attachments: event?.attachments ?? [],
    specials: [],
    //
    at: false,
    at_users: [],
    at_user: undefined,
    msg: event?.content ?? '',
    msg_txt: event?.content ?? '',
    msg_id: event.id,
    quote: '',
    open_id: open_id,
    //
    user_id: event.author.id,
    user_name: event.author.username,
    user_avatar: event.author.avatar,
    segment: segmentQQ,
    send_at: new Date().getTime()
  }
  APPS.response(e)
  APPS.responseMessage(e)
  return
}
