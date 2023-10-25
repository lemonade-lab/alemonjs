import {
  CardType,
  InstructionMatching,
  AMessage,
  getIP,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientAPIByQQ as Client, getWebConfig } from '../../sdk/index.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { ExampleObject } from '../types.js'
import IMGS from 'image-size'
import { ClientKOA } from '../../../koa/index.js'
import { AlemonJSError, AlemonJSLog } from 'src/log/user.js'

export const C2C_MESSAGE_CREATE = async (event: ExampleObject) => {
  /**
   * 获取ip
   */
  const ip = await getIP()

  const e = {} as AMessage

  const webCfg = getWebConfig()

  e.platform = 'ntqq'
  e.bot = getBotMsgByNtqq()
  e.event = 'MESSAGES'
  e.eventType = 'CREATE'
  e.isPrivate = false
  e.isRecall = false
  e.isGroup = false

  /* 消息发送机制 */
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
        if (Buffer.isBuffer(msg)) {
          const url = await ClientKOA.setLocalImg(msg)
          if (!url) return false
          return await Client.postFilesByGroup(event.group_id, url).catch(
            err => {
              console.error(err)
              return err
            }
          )
        }
      } catch (err) {
        return err
      }
    }
    /**
     * isString arr and find buffer
     */
    if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
      const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
      const cont = msg.filter(element => typeof element === 'string').join('')
      try {
        const dimensions = IMGS.imageSize(msg[isBuffer])
        const url = await ClientKOA.setLocalImg(msg[isBuffer] as Buffer)
        if (!url) return false
        return await Client.postMessageByGroup(
          event.group_id,
          `${cont}  ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
          event.id
        ).catch(err => {
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
      : ''

    if (content == '') {
      return false
    }

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
        return await Client.postFilesByGroup(event.group_id, url).catch(
          err => err
        )
      }
    }

    return await Client.postMessageByUser(
      event.author.id,
      content,
      event.id
    ).catch(err => {
      console.error(err)
      return err
    })
  }
  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          console.info('暂不可用')
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

  e.msg_txt = event.content

  e.msg = event.content

  /**
   * 消息编号
   */
  e.msg_id = event.id

  e.user_id = event.author.id

  e.user_avatar = 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638'

  e.user_name = '柠檬冲水'

  e.channel_id = event.group_id

  e.guild_id = event.group_id

  e.segment = segmentQQ

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
