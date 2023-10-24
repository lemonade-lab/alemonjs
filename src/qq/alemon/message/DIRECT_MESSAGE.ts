import { IOpenAPI } from 'qq-guild-bot'
import {
  typeMessage,
  AMessage,
  InstructionMatching,
  CardType,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientAPIByQQ as Client } from '../../sdk/index.js'
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
    isPrivate: false,
    isRecall: false,
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
  e.reply = async (
    msg: Buffer | string | (Buffer | string)[],
    select?: {
      quote?: string
      withdraw?: boolean
    }
  ) => {
    if (Buffer.isBuffer(msg)) {
      try {
        return await Client.postDirectImage({
          id: event.msg.guild_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg //buffer
        }).catch((err: any) => {
          console.error(err)
          return err
        })
      } catch (err) {
        console.error(err)
        return err
      }
    }
    // arr && find buffer
    if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
      const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
      const cont = msg.filter(element => typeof element === 'string').join('')
      try {
        return await Client.postDirectImage({
          id: event.msg.guild_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg[isBuffer] as Buffer, //buffer
          content: cont
        }).catch((err: any) => {
          console.error(err)
          return err
        })
      } catch (err) {
        console.error(err)
        return err
      }
    }
    const content = Array.isArray(msg)
      ? msg.join('')
      : typeof msg === 'string'
      ? msg
      : undefined
    /**
     * http
     */
    const match = content.match(/<http>(.*?)<\/http>/g)
    if (match) {
      const getUrl = match[1]
      const msg = await getUrlbuffer(getUrl)
      if (msg) {
        return await Client.postImage({
          id: event.msg.channel_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg //buffer
        }).catch(err => {
          console.error(err)
          return err
        })
      }
    }

    return await clientApiByQQ.directMessageApi
      .postDirectMessage(event.msg.guild_id, {
        msg_id: event.msg.id,
        content
      })
      .catch((err: any) => {
        console.error(err)
        return err
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
            .catch((err: any) => {
              console.error(err)
              return err
            })
        } else {
          return false
        }
      } catch (err) {
        console.error(err)
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
    console.info('不可用')
    return false
  }

  /**
   * 删除表情表态
   * @param mid
   * @param boj
   * @returns
   */
  e.deleteEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.info('不可用')
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
      console.info(
        console.info(
          `\n[${e.channel_id}] [${e.user_name}] [${true}] \n ${e.msg_txt}`
        )
      )
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(
        console.info(
          `\n[${e.channel_id}] [${e.user_name}] [${false}] \n ${e.msg_txt}`
        )
      )
      return false
    })
}
