import { IOpenAPI } from 'qq-guild-bot'
import {
  CardType,
  InstructionMatching,
  AMessage,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientQQ as Client } from '../../sdk/index.js'
import { setBotMsgByQQ } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import {
  AlemonJSError,
  AlemonJSLog,
  everyoneError
} from '../../../log/index.js'

declare global {
  /**
   * 接口对象
   */
  var ClientQQ: IOpenAPI
}

interface EventPublicDuildType {
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
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const mergeMessages = async (
  e: AMessage,
  event: EventPublicDuildType
) => {
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
    }
  ): Promise<any> => {
    // isBuffer

    if (Buffer.isBuffer(msg)) {
      try {
        return await Client.postImage({
          id: event.msg.channel_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg //buffer
        }).catch(everyoneError)
      } catch (err) {
        console.error(err)
        return err
      }
    }
    // arr & find buffer
    if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
      const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
      const cont = msg
        .map(item => {
          if (typeof item === 'number') return String(item)
          return item
        })
        .filter(element => typeof element === 'string')
        .join('')
      try {
        return await Client.postImage({
          id: event.msg.channel_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg[isBuffer] as Buffer, //buffer
          content: cont
        }).catch(everyoneError)
      } catch (err) {
        console.error(err)
        return err
      }
    }
    const content = Array.isArray(msg)
      ? msg.join('')
      : typeof msg === 'string'
      ? msg
      : typeof msg === 'number'
      ? `${msg}`
      : ''

    if (content == '') return false

    /**
     * http
     */

    const match = content.match(/<http>(.*?)<\/http>/)
    if (match) {
      const getUrl = match[1]
      const msg = await getUrlbuffer(getUrl)
      if (msg) {
        return await Client.postImage({
          id: event.msg.channel_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg //buffer
        }).catch(everyoneError)
      }
    }

    /**
     * 发送接口
     */
    return await ClientQQ.messageApi
      .postMessage(event.msg.channel_id, {
        msg_id: event.msg.id,
        content,
        message_reference: select?.quote
          ? { message_id: select?.quote }
          : undefined
      })
      .catch(everyoneError)
  }

  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          return await ClientQQ.messageApi
            .postMessage(event.msg.channel_id, {
              msg_id: event.msg.id,
              ...item.card
            })
            .catch(everyoneError)
        } else {
          return false
        }
      } catch (err) {
        return err
      }
    }
    return true
  }

  /**
   * 发送表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.replyEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    return await ClientQQ.reactionApi
      .postReaction(event.msg.channel_id, {
        message_id: mid,
        ...boj
      })
      .catch(everyoneError)
  }

  /**
   * 删除表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.deleteEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    return await ClientQQ.reactionApi
      .deleteReaction(event.msg.channel_id, {
        message_id: mid,
        ...boj
      })
      .catch(everyoneError)
  }

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
