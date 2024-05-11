import {
  APPS,
  type TypingEnum,
  type EventEnum,
  type MessageBingdingOption,
  MessageContentType
} from '../../../../core/index.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'
import { directController } from '../direct.js'
import { replyController } from '../reply.js'
import { segmentKOOK } from '../segment.js'
import { SystemData, joinedData } from '../../sdk/typings.js'

/**
 * 当成员移除时
 * @param event
 * @returns
 */
export const GUILD_MEMBER_REMOVE = async (event: SystemData) => {
  const body = event.extra.body as joinedData
  const masterID = ABotConfig.get('kook').masterID
  const e = {
    platform: 'kook',
    event: 'MEMBERS' as (typeof EventEnum)[number],
    typing: 'DELETE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(body.user_id)
      : masterID == body.user_id,
    attachments: [],
    specials: [],
    guild_id: event.target_id,
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
    msg_id: event.msg_id,
    //
    user_id: body.user_id,
    user_name: '',
    user_avatar: '',
    segment: segmentKOOK,
    send_at: new Date(body.joined_at).getTime(),
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: MessageContentType,
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? false
      const channel_id = select?.channel_id ?? event.target_id
      if (!msg_id) return false
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg_id, channel_id, body.user_id)
      }
      if (!channel_id) return false
      return await replyController(msg, `${channel_id}`)
    }
  }
  APPS.response(e)
  APPS.responseEventType(e)
  return
}
