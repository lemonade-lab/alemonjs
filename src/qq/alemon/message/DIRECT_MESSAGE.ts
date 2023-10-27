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
import { AlemonJSError, AlemonJSLog } from '../../../log/user.js'
import { AlemonJSEventError, AlemonJSEventLog } from '../../../log/event.js'
import { getBotConfigByKey } from '../../../config/index.js'

declare global {
  //接口对象
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
  const cfg = getBotConfigByKey('qq')
  const masterID = cfg.masterID
  const e = {
    platform: 'qq',
    bot: getBotMsgByQQ(),
    isMaster: event.msg.author.id == masterID ? true : false,
    event: 'MESSAGES',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    boundaries: 'publick',
    attribute: 'single'
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
    return await typeMessage(e)
      .then(() => AlemonJSEventLog(e.event, e.eventType))
      .catch(err => AlemonJSEventError(err, e.event, e.eventType))
    return
  }

  /**
   * 优化接口
   */
  await directMessage(e, event).catch(error)
  console.info(
    `\n[${event.msg.author.username}][${event.msg.author.id}][${e.isGroup}] ${
      event.msg.content ? event.msg.content : ''
    }`
  )
}

async function directMessage(e: AMessage, event: directEventData) {
  /* 消息发送机制 */
  e.reply = async (
    msg: Buffer | string | number | (Buffer | number | string)[],
    select?: {
      quote?: string
      withdraw?: number
    }
  ): Promise<any> => {
    if (Buffer.isBuffer(msg)) {
      try {
        return await Client.postDirectImage({
          id: event.msg.guild_id,
          msg_id: event.msg.id, //消息id, 必须
          image: msg //buffer
        }).catch(error)
      } catch (err) {
        console.error(err)
        return err
      }
    }
    // arr && find buffer
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
        return await Client.postDirectImage({
          id: event.msg.guild_id,
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
        }).catch(error)
      }
    }

    return await clientApiByQQ.directMessageApi
      .postDirectMessage(event.msg.guild_id, {
        msg_id: event.msg.id,
        content
      })
      .catch(error)
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
            .catch(error)
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
    console.info('temporarily unavailable')
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
    console.info('temporarily unavailable')
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
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
