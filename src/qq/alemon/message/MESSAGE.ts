import { IOpenAPI } from 'qq-guild-bot'
import {
  CardType,
  InstructionMatching,
  AMessage,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientAPIByQQ as Client } from '../../sdk/index.js'
import { Private } from '../privatechat.js'
import { EventData } from '../types.js'
import { segmentQQ } from '../segment.js'
import { setBotMsgByQQ } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/user.js'

declare global {
  /**
   * 接口对象
   */
  var clientApiByQQ: IOpenAPI
}

/**
 * 错误打印
 * @param err
 * @returns
 */
const error = err => {
  console.error(err)
  return err
}

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const mergeMessages = async (e: AMessage, event: EventData) => {
  /**
   * 屏蔽其他机器人的消息
   */
  if (event.msg.author.bot) return

  /**
   * 得到登录配置
   */

  const cfg = getBotConfigByKey('qq')

  /**
   * 得到主人id
   */
  const masterID = cfg.masterID

  /**
   * 默认不是主人
   */
  e.isMaster = false

  /**
   * 检查身份
   */
  if (event.msg.author.id == masterID) {
    /**
     * 是主人
     */
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
    msg: Buffer | string | (Buffer | string)[],
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
        }).catch(error)
      } catch (err) {
        console.error(err)
        return err
      }
    }
    // arr & find buffer
    if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
      const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
      const cont = msg.filter(element => typeof element === 'string').join('')
      try {
        return await Client.postImage({
          id: event.msg.channel_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg[isBuffer] as Buffer, //buffer
          content: cont
        }).catch(error)
      } catch (err) {
        console.error(err)
        return err
      }
    }
    const content = Array.isArray(msg)
      ? msg.join('')
      : typeof msg === 'string'
      ? msg
      : ''

    if (content == '') {
      return false
    }

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
        }).catch(error)
      }
    }

    /**
     * 发送接口
     */
    return await clientApiByQQ.messageApi
      .postMessage(event.msg.channel_id, {
        msg_id: event.msg.id,
        content,
        message_reference: select?.quote
          ? { message_id: select?.quote }
          : undefined
      })
      .catch(error)
  }

  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          return await clientApiByQQ.messageApi
            .postMessage(event.msg.channel_id, {
              msg_id: event.msg.id,
              ...item.card
            })
            .catch(error)
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
    return await clientApiByQQ.reactionApi
      .postReaction(event.msg.channel_id, {
        message_id: mid,
        ...boj
      })
      .catch(error)
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
    return await clientApiByQQ.reactionApi
      .deleteReaction(event.msg.channel_id, {
        message_id: mid,
        ...boj
      })
      .catch(error)
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
   * 模块
   */
  e.segment = segmentQQ

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
   * 公信专私信
   * @param msg
   * @param img
   * @returns
   */
  e.replyPrivate = async (
    msg: Buffer | string | (Buffer | string)[],
    select?: {
      quote?: string
      withdraw?: number
    }
  ): Promise<any> => {
    return await Private(event.msg, msg).catch(error)
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
