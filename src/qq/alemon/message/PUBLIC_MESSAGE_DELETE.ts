import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption
} from '../../../core/index.js'
import { segmentQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../config/index.js'
import { replyController } from '../reply.js'
import { Controllers } from '../controller.js'
import { directController } from '../direct.js'

/**
 * 公域
 * @param event
 */
export const PUBLIC_MESSAGE_DELETE = async (event: {
  message: {
    author: { bot: false; id: string; username: string }
    channel_id: string
    guild_id: string
    id: string
  }
  op_user: { id: string }
}) => {
  const masterID = ABotConfig.get('qq').masterID

  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'DELETE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.message.author.id)
      : event.message.author.id == masterID,
    attachments: [],
    specials: [],
    guild_id: event.message.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.message.channel_id,
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: event.message.id,
    msg_txt: '',
    msg: '',
    quote: '',
    open_id: event.message.guild_id,

    //
    user_id: event.message.author.id,
    user_name: event.message.author.username,
    user_avatar: '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
    /**
     * 发送消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? event.message.id
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: event.message.author.id
        })
      }
      const channel_id = select?.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    },
    Controllers
  }

  APPS.responseEventType(e)
}
