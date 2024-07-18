import {
  APPS,
  type EventEnum,
  type TypingEnum
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { segmentQQ } from '../segment.js'

/**
 * 机器人退出频道
 * @param event
 * @returns
 */
export const GUILD_DELETE = async (event: {
  description: string
  icon: string // 频道 a
  id: string // 频道 id
  joined_at: string // msg_time
  max_members: number
  member_count: number
  name: string // 频道name
  op_user_id: string
  owner: boolean
  owner_id: string
  union_appid: string
  union_org_id: string
  union_world_id: string
}) => {
  const e = {
    platform: 'qq',
    event: 'BOT' as (typeof EventEnum)[number],
    typing: 'DELETE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: false,
    attachments: [],
    specials: [],
    guild_id: event.id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: '',
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: '',
    msg_txt: '',
    quote: '',
    open_id: event.id,

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
    segment: segmentQQ,
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
