import {
  CardType,
  InstructionMatching,
  AMessage,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientNTQQ } from '../../sdk/index.js'
import { segmentNTQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { GROUP_DATA } from '../types.js'
import { ClientKOA } from '../../../koa/index.js'
import IMGS from 'image-size'
import {
  AlemonJSError,
  AlemonJSLog,
  everyoneError
} from '../../../log/index.js'

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: GROUP_DATA) => {
  const cfg = getBotConfigByKey('ntqq')
  const masterID = cfg.masterID
  const e = {
    platform: 'ntqq',
    bot: getBotMsgByNtqq(),
    isMaster: event.author.id == masterID ? true : false,
    event: 'MESSAGES',
    eventType: 'CREATE',
    isPrivate: false,
    isRecall: false,
    isGroup: true,
    boundaries: 'publick',
    attribute: 'group',
    /**
     * 特殊消息
     */
    attachments: []
  } as AMessage

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
    // is buffer
    if (Buffer.isBuffer(msg)) {
      try {
        const url = await ClientKOA.setLocalImg(msg)
        if (!url) return false
        return await ClientNTQQ.postFilesByGroup(event.group_id, url).catch(
          everyoneError
        )
      } catch (err) {
        console.error(err)
        return err
      }
    }

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
        return await ClientNTQQ.postMessageByGroup(
          event.group_id,
          `${cont} ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
          event.id
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
     * http
     */

    const match = content.match(/<http>(.*?)<\/http>/)
    if (match) {
      const getUrl = match[1]
      const msg = await getUrlbuffer(getUrl)
      if (Buffer.isBuffer(msg)) {
        const url = await ClientKOA.setLocalImg(msg)
        if (!url) return false
        return await ClientNTQQ.postFilesByGroup(event.group_id, url).catch(
          everyoneError
        )
      }
    }

    return await ClientNTQQ.postMessageByGroup(
      event.group_id,
      content,
      event.id
    ).catch(everyoneError)
  }

  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          console.info('temporarily unavailable')
          return false
        }
        return false
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
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.deleteEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.info('temporarily unavailable')
    return false
  }

  /**
   * 消息原文
   */
  e.msg_txt = event.content

  /**
   * 消息
   */
  e.msg = event.content.trim()

  /**
   * 消息编号
   */
  e.msg_id = event.id

  /**
   * 用户编号
   */
  e.user_id = event.author.id

  /**
   * 用户头像
   */
  e.user_avatar = 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638'

  /**
   * 用户名
   */
  e.user_name = '柠檬冲水'

  /**
   * 子频道编号
   */
  e.channel_id = event.group_id

  /**
   * 频道编号
   */
  e.guild_id = event.group_id

  /**
   * 模块
   */
  e.segment = segmentNTQQ

  /**
   * 被艾特的用户
   */
  e.at_users = []

  /**
   * 艾特消息处理
   */
  e.at = false

  /**
   * 存在at
   */
  if (e.at) {
    /**
     * 得到第一个艾特
     */
    e.at_user = e.at_users.find(item => item.bot != true)
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
