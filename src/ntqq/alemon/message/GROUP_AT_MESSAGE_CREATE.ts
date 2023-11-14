import {
  InstructionMatching,
  getUrlbuffer,
  PlatformEnum,
  EventEnum,
  EventType
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
import { ClientController } from '../controller.js'

/**
 * 公私域合并
 * @param e
 * @param data  原数据
 * @returns
 */
export const GROUP_AT_MESSAGE_CREATE = async (event: GROUP_DATA) => {
  const cfg = getBotConfigByKey('ntqq')
  const masterID = cfg.masterID

  const controller = ClientController({
    guild_id: event.group_id,
    channel_id: '0',
    msg_id: event.id,
    send_at: new Date().getTime()
  })

  const e = {
    platform: 'ntqq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'group' as 'group' | 'single',
    bot: getBotMsgByNtqq(),
    isMaster: event.author.id == masterID ? true : false,
    isPrivate: false,
    isRecall: false,
    isGroup: true,
    attachments: [],
    specials: [],
    msg_txt: event.content,
    msg: event.content.trim(),
    msg_id: event.id,
    user_id: event.author.id,
    user_avatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    user_name: '柠檬冲水',
    guild_id: event.group_id,
    channel_id: event.group_id,
    segment: segmentNTQQ,
    at_users: [],
    at: false,
    at_user: undefined,
    send_at: new Date().getTime(),
    controller,
    /**
     * 消息发送机制
     * @param msg 消息
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
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
  }

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
