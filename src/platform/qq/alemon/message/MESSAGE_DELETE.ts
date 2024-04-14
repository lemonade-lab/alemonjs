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
import { replyController } from '../reply.js'

import { directController } from '../direct.js'

/**
 * *私域*
 */

/**
 * 删除（撤回）消息事件
 * @param event
 * @returns
 */
export const MESSAGE_DELETE = async (event: any) => {
  // 屏蔽其他机器人的消息
  if (event.author?.bot) return

  const masterID = ABotConfig.get('qq').masterID

  const e = {
    platform: 'qq',
    event: 'MESSAGES' as (typeof EventEnum)[number],
    typing: 'CREATE' as (typeof TypingEnum)[number],
    boundaries: 'private' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: BotMessage.get(),
    isMaster: Array.isArray(masterID)
      ? masterID.includes(event?.author?.id)
      : event?.author?.id == masterID,
    attachments: event?.msg?.attachments ?? [],
    specials: [],
    guild_id: event.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.channel_id,
    at: false,
    at_user: undefined,
    at_users: [],
    msg: event?.content ?? '',
    msg_txt: event?.content ?? '',
    msg_id: event?.id ?? '',
    quote: '',
    open_id: event.guild_id,

    user_id: event?.author?.id ?? '',
    user_name: event?.author?.username ?? '',
    user_avatar: event?.author?.avatar ?? '',
    segment: segmentQQ,
    send_at: new Date().getTime(),
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
      const withdraw = select?.withdraw ?? 0
      const msg_id = select?.channel_id ?? event?.id
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw,
          open_id: select?.open_id,
          user_id: event?.author?.id ?? ''
        })
      }
      const channel_id = select?.channel_id ?? event.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    }
  }

  /**
   * 撤回消息
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.typing = 'DELETE'

    APPS.responseEventType(e)
    return
  }

  if (event.mentions) {
    /**
     * 去掉@ 转为纯消息
     */
    for await (const item of event.mentions) {
      if (item.bot != true) {
        // 用户艾特才会为真
        e.at = true
      }
      e.at_users.push({
        id: item.id,
        name: item.username,
        avatar: item.avatar,
        bot: item.bot
      })
    }
    /**
     * 循环删除文本中的at信息并去除前后空格
     */
    e.at_users.forEach(item => {
      e.msg = e.msg.replace(`<@!${item.id}>`, '').trim()
    })
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

  if (e.bot.avatar == '') {
    /**
     * 配置一下机器人头像
     */
    const bot = e.at_users.find(item => item.bot == true && item.id == e.bot.id)
    if (bot) {
      e.bot.avatar = bot.avatar
      BotMessage.set('id', e.bot.id)
      BotMessage.set('name', e.bot.name)
      BotMessage.set('avatar', e.bot.avatar)
    }
  }

  APPS.responseMessage(e)
  return
}
