import { IOpenAPI, Embed, Ark } from 'qq-guild-bot'
import { InstructionMatching } from 'alemon'
import { EventEnum, EventType, AMessage, PlatformEnum } from 'alemon'
import { postImage } from '../alemonapi.js'
import { Private } from '../privatechat.js'
import { getBotConfigByQQ } from '../../config.js'
import { EventData } from '../types.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByQQ } from '../bot.js'

declare global {
  /**
   * 接口对象
   */
  var clientApiByQQ: IOpenAPI
}

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const mergeMessages = async (e: AMessage, data: EventData) => {
  /**
   * 屏蔽其他机器人的消息
   */
  if (data.msg.author.bot) return

  e.platform = PlatformEnum.qq

  e.bot = getBotMsgByQQ()

  /**
   * 事件匹配
   */
  e.event = EventEnum.MESSAGES
  /**
   * 类型匹配
   */
  e.eventType = EventType.CREATE

  /**
   * 得到登录配置
   */

  const cfg = getBotConfigByQQ()

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
  if (data.msg.author.id == masterID) {
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
   * 封装发送截图
   * @param file_image
   * @param content 内容,可选
   * @returns
   */
  const ePostImage = async (image: Buffer, content?: string): Promise<boolean> => {
    if (!e.isGroup) return false
    return await postImage({
      /**
       * 子频道id
       */
      id: data.msg.channel_id,
      /**
       * 消息id
       */
      msg_id: data.msg.id,
      /**
       * buffer
       */
      image,
      /**
       * 内容
       */
      content,
      /**
       * 是群聊
       */
      isGroup: true
    })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /**
   * 消息发送机制
   * @param msg 消息
   * @param img
   * @returns
   */
  e.reply = async (msg?: string | string[] | Buffer, img?: Buffer): Promise<boolean> => {
    /**
     * 是buffer
     */
    if (Buffer.isBuffer(msg)) {
      try {
        return await ePostImage(msg)
          .then(() => true)
          .catch(err => {
            console.error(err)
            return false
          })
      } catch (err) {
        console.error(err)
        return false
      }
    }
    /**
     * 整个msg
     */
    const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
    /**
     * 是buffer
     */
    if (Buffer.isBuffer(img)) {
      try {
        return await ePostImage(img, content)
          .then(() => true)
          .catch(err => {
            console.error(err)
            return false
          })
      } catch (err) {
        console.error(err)
        return false
      }
    }
    /**
     * 发送接口
     */
    return await clientApiByQQ.messageApi
      .postMessage(data.msg.channel_id, {
        msg_id: data.msg.id,
        content
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  e.replyCard = async (obj: { type: 'embed' | 'ark'; card: { embed: Embed } | { ark: Ark } }) => {
    /**
     * 发送卡片需要识别卡片类型
     */
    const { type, card } = obj
    if (type == 'embed' || type == 'ark') {
      /**
       * 频道
       */
      return await clientApiByQQ.messageApi
        .postMessage(data.msg.channel_id, {
          msg_id: data.msg.id,
          ...card
        })
        .then(() => true)
        .catch((err: any) => {
          console.error(err)
          return false
        })
    } else {
      /**
       * 其他类型的卡片
       */
      return false
    }
  }

  /**
   * 引用消息
   * @param mid
   * @param boj
   * @returns
   */

  e.replyByMid = async (mid: string, msg: string) => {
    return await clientApiByQQ.messageApi
      .postMessage(data.msg.channel_id, {
        msg_id: mid,
        content: msg,
        message_reference: { message_id: mid }
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
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
      .postReaction(data.msg.channel_id, {
        message_id: mid,
        ...boj
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
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
      .deleteReaction(data.msg.channel_id, {
        message_id: mid,
        ...boj
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /**
   * 消息原文
   */
  e.msg_txt = data.msg.content

  /**
   * 消息
   */
  e.msg = data.msg.content

  /**
   * 消息编号
   */
  e.msg_id = data.msg.id

  /**
   * 用户编号
   */
  e.user_id = data.msg.author.id

  /**
   * 用户头像
   */
  e.user_avatar = data.msg.author.avatar

  /**
   * 用户名
   */
  e.user_name = data.msg.author.username

  /**
   * 子频道编号
   */
  e.channel_id = data.msg.channel_id

  /**
   * 频道编号
   */
  e.guild_id = data.msg.guild_id

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

  if (data.msg.mentions) {
    /**
     * 去掉@ 转为纯消息
     */
    for await (const item of data.msg.mentions) {
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
    // 得到第一个艾特
    e.at_user = e.at_users.find(item => item.bot != true)
  }

  /**
   * 机器人信息  tudo
   */
  e.bot = {
    id: '',
    name: '',
    avatar: ''
  }

  /**
   * 公信专私信
   * @param msg
   * @param img
   * @returns
   */
  e.replyPrivate = async (msg?: string | string[] | Buffer, img?: Buffer): Promise<boolean> => {
    return await Private(data.msg, msg, img)
      .then(res => {
        return res
      })
      .catch(err => {
        return err
      })
  }

  /**
   * 消息处理
   */
  await InstructionMatching(e)
    .then(() => {
      console.info(
        `\n[${data.msg.channel_id}] [${data.msg.author.username}] [${true}] \n ${data.msg.content}`
      )
      return
    })
    .catch((err: any) => {
      console.error(err)
      console.info(
        `\n[${data.msg.channel_id}] [${data.msg.author.username}] [${false}] \n ${data.msg.content}`
      )
      return
    })
}
