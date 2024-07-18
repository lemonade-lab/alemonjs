import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption,
  type MessageContentType
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { segmentQQ } from '../segment.js'

import { ABotConfig } from '../../../../config/index.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'

export const MESSAGE_REACTION_ADD = async (event: {
  channel_id: string
  emoji: { id: string; type: number }
  guild_id: string
  target: {
    id: string
    type: string
  }
  user_id: string
}) => {
  const masterID = ABotConfig.get('qq').masterID

  const e = {
    platform: 'qq',
    event: 'REACTIONS' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event?.user_id)
      : event.user_id == masterID,
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.channel_id,
    attachments: [],
    specials: [
      {
        emoticon_id: event.emoji.id,
        emoticon_type: event.emoji.type,
        emoticon: '',
        is_cancel: false,
        msg_uid: ''
      }
    ],
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg: '',
    msg_id: event.target.id,
    msg_txt: '',
    quote: '',

    open_id: event.guild_id,

    //
    user_id: event.user_id,
    user_name: '',
    user_avatar: '',
    send_at: new Date().getTime()
  }

  APPS.response(e)
  APPS.responseEventType(e)
  return
}
