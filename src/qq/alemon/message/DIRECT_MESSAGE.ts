import { IOpenAPI, Embed, Ark } from 'qq-guild-bot'
import { typeMessage, AMessage, InstructionMatching } from 'alemon'
import { postImage } from '../alemonapi.js'
import { directEventData } from '../types.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByQQ } from '../bot.js'

declare global {
  //接口对象
  var clientApiByQQ: IOpenAPI
}

/**
 * *
 * 私信
 * *
 */

/**
DIRECT_MESSAGE (1 << 12)
  - DIRECT_MESSAGE_CREATE   // 当收到用户发给机器人的私信消息时
  - DIRECT_MESSAGE_DELETE   // 删除（撤回）消息事件
 */
export const DIRECT_MESSAGE = async (data: directEventData) => {
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    event: 'MESSAGES',
    eventType: 'CREATE',
    /**
     * 不是私域
     */
    isPrivate: false,
    /**
     * 不是撤回
     */
    isRecall: false,
    /**
     * 不是群聊
     */
    isGroup: false
  } as AMessage

  /**
   * 撤回事件
   */
  if (new RegExp(/^DIRECT_MESSAGE_DELETE$/).test(data.eventType)) {
    e.eventType = 'DELETE'
    e.isRecall = true
    /**
     * 只匹配类型
     */
    await typeMessage(e as AMessage)
      .then(() => {
        console.info(`\n[${e.event}] [${e.eventType}] [${true}]`)
        return true
      })
      .catch(err => {
        console.error(err)
        console.error(`\n[${e.event}] [${e.eventType}] [${false}]`)
        return false
      })
    return
  }

  /**
   * 优化接口
   */
  await directMessage(e, data).catch(err => {
    console.error(err)
    return
  })
  console.info(
    `\n[${data.msg.author.username}][${data.msg.author.id}][${e.isGroup}] ${
      data.msg.content ? data.msg.content : ''
    }`
  )
}

async function directMessage(e: AMessage, data) {
  /**
   * 发送截图
   * @param file_image
   * @param content 内容,可选
   * @returns
   */
  const ePostImage = async (image: Buffer, content?: string): Promise<boolean> => {
    return await postImage({
      id: data.msg.guild_id,
      msg_id: data.msg.id, //消息id, 必须
      image, //buffer
      content,
      isGroup: false
    })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }

  /* 消息发送机制 */
  e.reply = async (msg?: string | string[] | Buffer, img?: Buffer) => {
    if (Buffer.isBuffer(msg)) {
      try {
        return await ePostImage(msg).catch(err => {
          console.error(err)
          return false
        })
      } catch (err) {
        console.error(err)
        return false
      }
    }
    const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
    if (Buffer.isBuffer(img)) {
      try {
        return await ePostImage(img, content).catch(err => {
          console.error(err)
          return false
        })
      } catch (err) {
        console.error(err)
        return false
      }
    }
    return await clientApiByQQ.directMessageApi
      .postDirectMessage(data.msg.guild_id, {
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
   * 发送表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.replyEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.log('不可用')
    return false
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
    console.log('不可用')
    return false
  }

  e.msg_txt = data.msg.content

  e.msg = data.msg.content

  /**
   * 消息编号
   */
  e.msg_id = data.msg.id

  e.user_id = data.msg.author.id

  e.user_avatar = data.msg.author.avatar

  e.user_name = data.msg.author.username

  e.channel_id = data.msg.channel_id

  e.guild_id = data.msg.guild_id

  e.segment = segmentQQ

  e.at_users = []

  e.at_user = {
    id: '0',
    avatar: '0',
    name: '0',
    bot: false
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
   * 艾特消息处理
   */
  e.at = false

  /**
   * 消息处理
   */
  await InstructionMatching(e)
    .then(() => {
      console.info(
        `\n[${data.msg.channel_id}] [${data.msg.author.username}]\n${data.msg.content}${true}`
      )
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(
        `\n[${data.msg.channel_id}] [${data.msg.author.username}]\n${data.msg.content}${false}`
      )
      return false
    })
}
