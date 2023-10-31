import {
  CardType,
  InstructionMatching,
  AMessage,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientNTQQ } from '../../sdk/index.js'
import { segmentNTQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { USER_DATA } from '../types.js'
import IMGS from 'image-size'
import { ClientKOA } from '../../../koa/index.js'
import {
  AlemonJSError,
  AlemonJSLog,
  everyoneError
} from '../../../log/index.js'
import { getBotConfigByKey } from '../../../config/index.js'

export const C2C_MESSAGE_CREATE = async (event: USER_DATA) => {
  const cfg = getBotConfigByKey('ntqq')
  const masterID = cfg.masterID
  const e = {
    platform: 'ntqq',
    bot: getBotMsgByNtqq(),
    isMaster: event.author.id == masterID ? true : false,
    event: 'MESSAGES',
    eventType: 'CREATE',
    // 是私
    isPrivate: false,
    isRecall: false,
    isGroup: false,
    boundaries: 'publick',
    // 是私聊
    attribute: 'single'
  } as AMessage

  /* 消息发送机制 */
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
        const url = await ClientKOA.setLocalImg(msg)
        if (!url) return false
        return await ClientNTQQ.postFilesByUsers(
          event.author.user_openid,
          url
        ).catch(everyoneError)
      } catch (err) {
        console.error(err)
        return err
      }
    }
    /**
     * isString arr and find buffer
     */
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
        const dimensions = IMGS.imageSize(msg[isBuffer] as Buffer)
        const url = await ClientKOA.setLocalImg(msg[isBuffer] as Buffer)
        if (!url) return false
        return await ClientNTQQ.postMessageByUser(
          event.author.user_openid,
          `${cont}  ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
          select?.quote
        ).catch(everyoneError)
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
     * https
     */
    const match = content.match(/<http>(.*?)<\/http>/)
    if (match) {
      const getUrl = match[1]
      const msg = await getUrlbuffer(getUrl)
      if (Buffer.isBuffer(msg)) {
        const url = await ClientKOA.setLocalImg(msg)
        if (!url) return false
        return await ClientNTQQ.postFilesByUsers(
          event.author.user_openid,
          url
        ).catch(everyoneError)
      }
    }

    return await ClientNTQQ.postMessageByUser(
      event.author.user_openid,
      content,
      select?.quote
    ).catch(everyoneError)
  }

  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          console.info('temporarily unavailable')
          return false
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

  e.msg_txt = event.content

  e.msg = event.content

  /**
   * 消息编号
   */
  e.msg_id = event.id

  e.user_id = event.author.id

  e.user_avatar = 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638'

  e.user_name = '柠檬冲水'

  e.channel_id = event.author.user_openid // 私聊重置为用户open编号

  e.guild_id = event.author.user_openid

  e.segment = segmentNTQQ

  e.at_users = []

  e.at_user = {
    id: '0',
    avatar: '0',
    name: '0',
    bot: false
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
