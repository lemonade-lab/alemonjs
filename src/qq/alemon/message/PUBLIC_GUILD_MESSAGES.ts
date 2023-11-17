import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType,
  MessageBingdingOption
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import { segmentQQ } from '../segment.js'
import { InstructionMatching } from '../../../core/index.js'
import { setBotMsgByQQ } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { replyController } from '../reply.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'
import { directController } from '../direct.js'

interface PUBLIC_GUILD_MESSAGES_TYPE {
  eventType: 'AT_MESSAGE_CREATE'
  eventId: string
  msg: {
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
    guild_id: string
    id: string
    member: {
      joined_at: string
      nick: string
      roles: string[]
    }
    mentions: {
      avatar: string
      bot: boolean
      id: string
      username: string
    }[]
    seq: number
    seq_in_channel: string
    timestamp: string
  }
}

/**
 * *
 * 公域
 * *
 */

/**
 PUBLIC_GUILD_MESSAGES (1 << 30) // 消息事件，此为公域的消息事件
 AT_MESSAGE_CREATE       // 当收到@机器人的消息时
 PUBLIC_MESSAGE_DELETE   // 当频道的消息被删除时
 */
export const PUBLIC_GUILD_MESSAGES = async (
  event: PUBLIC_GUILD_MESSAGES_TYPE
) => {
  const Message = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    msg_id: event.msg.id
  })

  const Member = ClientControllerOnMember({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    user_id: event.msg.author.id
  })

  const cfg = getBotConfigByKey('qq')
  const masterID = cfg.masterID

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isMaster: event.msg.author.id == masterID,
    attachments: event?.msg?.attachments ?? [],
    specials: [],
    guild_id: event.msg.guild_id,
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    channel_id: event.msg.channel_id,
    //
    at: false,
    at_user: undefined,
    at_users: [],
    msg_id: event.msg.id,
    msg_txt: event.msg?.content ?? '',
    msg: event.msg?.content ?? '',
    open_id: event.msg.guild_id,

    //
    user_id: event.msg.author.id,
    user_name: event.msg.author.username,
    user_avatar: event.msg.author.avatar,
    segment: segmentQQ,
    send_at: new Date().getTime(),
    Message,
    Member,
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
      const msg_id = select?.msg_id ?? event.msg.id
      const withdraw = select?.withdraw ?? 0
      if (select?.open_id && select?.open_id != '') {
        return await directController(msg, select?.open_id, msg_id, {
          withdraw
        })
      }
      const channel_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id, {
        quote: select?.quote,
        withdraw
      })
    }
  }

  /**
   * 消息撤回
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.eventType = 'DELETE'
    return await typeMessage(e)
      .then(() => AlemonJSEventLog(e.event, e.eventType))
      .catch(err => AlemonJSEventError(err, e.event, e.eventType))
  }

  // 屏蔽其他机器人的消息
  if (event.msg.author.bot) return

  if (event.msg.mentions) {
    /**
     * 去掉@ 转为纯消息
     */
    for await (const item of event.msg.mentions) {
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

  if (e.bot.avatar == 'string') {
    /**
     * 配置一下机器人头像
     */
    const bot = e.at_users.find(item => item.bot == true && item.id == e.bot.id)
    if (bot) {
      e.bot.avatar = bot.avatar
      setBotMsgByQQ(bot)
    }
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
