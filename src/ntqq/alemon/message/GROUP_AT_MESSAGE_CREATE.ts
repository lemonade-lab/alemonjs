import {
  CardType,
  InstructionMatching,
  AMessage,
  getIP
} from '../../../core/index.js'
import { ClientAPIByQQ as Client, getWebConfig } from '../../sdk/index.js'
import { segmentQQ } from '../segment.js'
import { getBotMsgByNtqq } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { ExampleObject } from '../types.js'
import { setLocalImg } from '../../sdk/web/index.js'
import IMGS from 'image-size'

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: ExampleObject) => {
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

  const webCfg = getWebConfig()

  /**
   * 消息发送机制
   * @param msg 消息
   * @param img
   * @returns
   */
  e.reply = async (
    msg: Buffer | string | (Buffer | string)[],
    select?: {
      quote?: boolean
      withdraw?: boolean
    }
  ): Promise<boolean> => {
    if (Buffer.isBuffer(msg)) {
      try {
        let url = ''
        if (Buffer.isBuffer(msg)) {
          /**
           * 挂载图片
           */
          const uul = await setLocalImg(msg)
          url = `${webCfg.http}://${ip}:${webCfg.callback_port}${uul}`
          return await Client.postFilesByGroup(event.group_id, url).catch(
            err => {
              console.error(err)
              return false
            }
          )
        }
      } catch (err) {
        console.error(err)
        return false
      }
    }
    const content = Array.isArray(msg)
      ? msg.join('')
      : typeof msg === 'string'
      ? msg
      : undefined
    if (Buffer.isBuffer(img)) {
      try {
        let url = ''
        const dimensions = IMGS.imageSize(img)
        const uul = await setLocalImg(img)
        url = `${webCfg.http}://${ip}:${webCfg.callback_port}${uul}`
        return await Client.postMessageByGroup(
          event.group_id,
          `${content} ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
          event.id
        )
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
    return await Client.postMessageByGroup(event.group_id, content, event.id)
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
          console.info('暂不可用')
          return false
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
   * 消息处理
   */
  await InstructionMatching(e)
    .then(() => {
      console.info(
        `\n[${e.channel_id}] [${e.user_name}] [${true}] \n ${e.msg_txt}`
      )
      return
    })
    .catch((err: any) => {
      console.error(err)
      console.info(
        `\n[${e.channel_id}] [${e.user_name}] [${false}] \n ${e.msg_txt}`
      )
      return
    })
}
