import {
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption,
  MessageContentType
} from '../../../../core/index.js'
import { APPS } from '../../../../core/index.js'

import { BotMessage } from '../bot.js'
import { segmentDISCORD } from '../segment.js'
import { replyController } from '../reply.js'

/**
 * 子频道更新
 * @param event
 */
export async function CHANNEL_UPDATE(event: {
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
}) {
  const e = {
    platform: 'qq',
    event: 'CHANNEL' as (typeof EventEnum)[number],
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
    msg_id: event.id,
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: '',

    //
    user_id: '',
    user_name: '',
    user_avatar: '',
    segment: segmentDISCORD,
    send_at: new Date().getTime(),
    /**
     * 发送消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: MessageContentType,
      select?: MessageBingdingOption
    ): Promise<any> => {
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.open_id != '') {
        return false
      }
      const channel_id = select?.channel_id
      return await replyController(msg, channel_id, {
        quote: select?.quote,
        withdraw
      })
    }
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
