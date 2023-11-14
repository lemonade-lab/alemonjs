import {
  typeMessage,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { getBotMsgByQQ } from '../bot.js'
import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/index.js'
import { segmentQQ } from '../segment.js'
import { InstructionMatching } from '../../../core/index.js'
import { setBotMsgByQQ } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { replyController } from '../reply.js'
import { ClientController } from '../controller.js'

/**
 * *私域*
 */

/** 
GUILD_MESSAGES (1 << 9)    // 消息事件，仅 *私域* 机器人能够设置此 intents。
  - MESSAGE_CREATE         
  // 频道内的全部消息，
  而不只是 at 机器人的消息。
  内容与 AT_MESSAGE_CREATE 相同
  - MESSAGE_DELETE         // 删除（撤回）消息事件
 * */
export const GUILD_MESSAGES = async (event: any) => {
  const controller = ClientController({
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    msg_id: event.msg.id,
    send_at: new Date().getTime()
  })

  const e = {
    platform: 'qq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByQQ(),
    isPrivate: true,
    isRecall: false,
    isGroup: true,
    attachments: event?.msg?.attachments ?? [],
    specials: [],
    user_id: '',
    user_name: '',
    isMaster: false,
    send_at: new Date().getTime(),
    user_avatar: '',
    at: false,
    msg_id: '',
    msg_txt: '',
    segment: segmentQQ,
    msg: '',
    at_user: undefined,
    guild_id: event.msg.guild_id,
    channel_id: event.msg.channel_id,
    at_users: [],
    /**
     * 发现消息
     * @param msg
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {
      const channel_id = select?.channel_id ?? event.msg.channel_id
      const msg_id = select?.channel_id ?? event.msg.channel_id
      return await replyController(msg, channel_id, msg_id)
    },
    controller
  }

  /**
   * 撤回消息
   */
  if (new RegExp(/DELETE$/).test(event.eventType)) {
    e.eventType = 'DELETE'
    e.isRecall = true

    e.boundaries = 'publick'
    e.attribute = 'group'
    /**
     * 只匹配类型
     */
    return await typeMessage(e)
      .then(() => AlemonJSEventLog(e.event, e.eventType))
      .catch(err => AlemonJSEventError(err, e.event, e.eventType))
  }

  // 屏蔽其他机器人的消息
  if (event.msg.author.bot) return
  const cfg = getBotConfigByKey('qq')
  const masterID = cfg.masterID

  /**
   * 检查身份
   */
  if (event.msg.author.id == masterID) {
    e.isMaster = true
  }

  /**
   * 是群聊
   */
  e.isGroup = true

  /**
   * 消息发送机制
   * @param msg 消息
   * @param img
   * @returns
   */
  e.reply = async (
    msg: Buffer | string | number | (Buffer | number | string)[],
    select?: {
      quote?: string
      withdraw?: number
      guild_id?: string
      channel_id?: string
      msg_id?: string
    }
  ): Promise<any> => {
    const channel_id = select?.channel_id ?? event.msg.channel_id
    const msg_id = select?.channel_id ?? event.msg.channel_id
    return await replyController(msg, channel_id, msg_id)
  }

  // e.replyCard = async (arr: CardType[]) => {
  //   for (const item of arr) {
  //     try {
  //       if (item.type == 'qq_ark' || item.type == 'qq_embed') {
  //         return await ClientQQ.messageApi
  //           .postMessage(event.msg.channel_id, {
  //             msg_id: event.msg.id,
  //             ...item.card
  //           })
  //           .catch(everyoneError)
  //       } else {
  //         return false
  //       }
  //     } catch (err) {
  //       return err
  //     }
  //   }
  //   return true
  // }

  // /**
  //  * 发送表情表态
  //  * @param mid
  //  * @param boj { emoji_type: number; emoji_id: string }
  //  * @returns
  //  */
  // e.replyEmoji = async (
  //   mid: string,
  //   boj: { emoji_type: number; emoji_id: string }
  // ): Promise<boolean> => {
  //   return await ClientQQ.reactionApi
  //     .postReaction(event.msg.channel_id, {
  //       message_id: mid,
  //       ...boj
  //     })
  //     .catch(everyoneError)
  // }

  // /**
  //  * 删除表情表态
  //  * @param mid
  //  * @param boj { emoji_type: number; emoji_id: string }
  //  * @returns
  //  */
  // e.deleteEmoji = async (
  //   mid: string,
  //   boj: { emoji_type: number; emoji_id: string }
  // ): Promise<boolean> => {
  //   return await ClientQQ.reactionApi
  //     .deleteReaction(event.msg.channel_id, {
  //       message_id: mid,
  //       ...boj
  //     })
  //     .catch(everyoneError)
  // }

  /**
   * 消息原文
   */
  e.msg_txt = event.msg.content

  /**
   * 消息
   */
  e.msg = event.msg.content

  /**
   * 消息编号
   */
  e.msg_id = event.msg.id

  /**
   * 用户编号
   */
  e.user_id = event.msg.author.id

  /**
   * 用户头像
   */
  e.user_avatar = event.msg.author.avatar

  /**
   * 用户名
   */
  e.user_name = event.msg.author.username

  /**
   * 子频道编号
   */
  e.channel_id = event.msg.channel_id

  /**
   * 频道编号
   */
  e.guild_id = event.msg.guild_id

  /**
   * 被艾特的用户
   */
  e.at_users = []

  /**
   * 艾特消息处理
   */
  e.at = false

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
