import { IOpenAPI } from 'qq-guild-bot'
import { typeMessage, AMessage, InstructionMatching, CardType } from 'alemon'
import { postDirectImage } from '../api.js'
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
export const DIRECT_MESSAGE = async (event: directEventData) => {
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
  if (new RegExp(/^DIRECT_MESSAGE_DELETE$/).test(event.eventType)) {
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
  await directMessage(e, event).catch(err => {
    console.error(err)
    return
  })
  console.info(
    `\n[${event.msg.author.username}][${event.msg.author.id}][${e.isGroup}] ${
      event.msg.content ? event.msg.content : ''
    }`
  )
}

async function directMessage(e: AMessage, event: directEventData) {
  /* 消息发送机制 */
  e.reply = async (msg?: string | string[] | Buffer, img?: Buffer | string, name?: string) => {
    if (Buffer.isBuffer(msg)) {
      try {
        return await postDirectImage({
          id: event.msg.guild_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg, //buffer
          name: typeof img == 'string' ? img : 'result.jpg'
        })
          .then(() => true)
          .catch((err: any) => {
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
        return await postDirectImage({
          id: event.msg.guild_id,
          msg_id: event.msg.id, //消息id, 必须
          image: img, //buffer
          content,
          name: name ?? 'result.jpg'
        })
          .then(() => true)
          .catch((err: any) => {
            console.error(err)
            return false
          })
      } catch (err) {
        console.error(err)
        return false
      }
    }
    return await clientApiByQQ.directMessageApi
      .postDirectMessage(event.msg.guild_id, {
        msg_id: event.msg.id,
        content
      })
      .then(() => true)
      .catch((err: any) => {
        console.error(err)
        return false
      })
  }
  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          await clientApiByQQ.messageApi
            .postMessage(event.msg.channel_id, {
              msg_id: event.msg.id,
              ...item.card
            })
            .then(() => true)
            .catch((err: any) => {
              console.error(err)
              return false
            })
        } else {
          return false
        }
      } catch {
        return false
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

  e.msg_txt = event.msg.content

  e.msg = event.msg.content

  /**
   * 消息编号
   */
  e.msg_id = event.msg.id

  e.user_id = event.msg.author.id

  e.user_avatar = event.msg.author.avatar

  e.user_name = event.msg.author.username

  e.channel_id = event.msg.channel_id

  e.guild_id = event.msg.guild_id

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
      console.info(console.info(`\n[${e.channel_id}] [${e.user_name}] [${true}] \n ${e.msg_txt}`))
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(console.info(`\n[${e.channel_id}] [${e.user_name}] [${false}] \n ${e.msg_txt}`))
      return false
    })
}
