import {
  CardType,
  InstructionMatching,
  AMessage,
  getIP,
  getUrlbuffer
} from '../../../core/index.js'
import { ClientAPIByQQ as Client } from '../../sdk/index.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { GROUP_DATA } from '../types.js'
import { ClientKOA } from '../../../koa/index.js'
import IMGS from 'image-size'
import { AlemonJSError, AlemonJSLog } from 'src/log/user.js'

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: GROUP_DATA) => {
  /**
   * 获取ip
   */
  const ip = await getIP()

  const e = {} as AMessage
  e.platform = 'ntqq'
  e.bot = getBotMsgByNtqq()
  e.event = 'MESSAGES'
  e.eventType = 'CREATE'
  e.isPrivate = false
  e.isRecall = false
  e.isGroup = true

  /**
   * 得到登录配置
   */

  const cfg = getBotConfigByKey('ntqq')

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
  if (event.author.id == masterID) {
    /**
     * 是主人
     */
    e.isMaster = true
  }

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
    // is buffer
    if (Buffer.isBuffer(msg)) {
      try {
        if (Buffer.isBuffer(msg)) {
          // 挂载图片
          const url = await ClientKOA.setLocalImg(msg)
          if (!url) return false
          return await Client.postFilesByGroup(event.group_id, url).catch(
            err => err
          )
        }
      } catch (err) {
        console.error(err)
        return err
      }
    }
    if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
      const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
      const cont = msg.filter(element => typeof element === 'string').join('')
      try {
        const dimensions = IMGS.imageSize(msg[isBuffer])
        const url = await ClientKOA.setLocalImg(msg[isBuffer] as Buffer)
        if (!url) return false
        return await Client.postMessageByGroup(
          event.group_id,
          `${cont} ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
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
     * http
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

    return await Client.postMessageByGroup(
      event.group_id,
      content,
      event.id
    ).catch(err => err)
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
    console.info('暂不可用')
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
    console.info('暂不可用')
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
  e.segment = segmentQQ

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
