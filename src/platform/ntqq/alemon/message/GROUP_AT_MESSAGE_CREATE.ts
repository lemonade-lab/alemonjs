import {
  APPS,
  type EventEnum,
  type TypingEnum,
  type MessageBingdingOption,
  MessageContentType
} from '../../../../core/index.js'
import { segmentNTQQ } from '../segment.js'
import { BotMessage } from '../bot.js'
import { ABotConfig } from '../../../../config/index.js'
import { GROUP_DATA } from '../types.js'
import { replyController } from '../reply.js'
import { directController } from '../direct.js'
/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: GROUP_DATA) => {
  const masterID = ABotConfig.get('ntqq').masterID
  const e = {
    platform: 'ntqq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event.author.id)
      : event.author.id == masterID,
    guild_id: event.group_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.group_id,
    attachments: [],
    specials: [],
    msg_txt: event.content,
    msg: event.content.trim(),
    msg_id: event.id,
    quote: '',
    open_id: event.author.member_openid,
    user_id: event.author.id,
    user_avatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    user_name: '柠檬冲水',
    segment: segmentNTQQ,
    at_users: [],
    at: false,
    at_user: undefined,
    send_at: new Date().getTime(),

    /**
     * 消息发送机制
     * @param msg 消息
     * @param img
     * @returns
     */
    reply: async (
      msg: MessageContentType,
      select?: MessageBingdingOption
    ): Promise<any> => {
      const msg_id = select?.msg_id ?? event.id
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id)
      }
      const group_id = select?.guild_id ?? event.group_id
      return await replyController(msg, group_id, msg_id)
    }
  }

  /**
   * 存在at
   */
  if (e.at) {
    /**
     * 得到第一个艾特
     */
    e.at_user = e.at_users.find(item => item.bot != true)
  }

  APPS.responseMessage(e)
  return
}
