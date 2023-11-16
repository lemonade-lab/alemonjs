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
import { USER_DATA } from '../types.js'
import IMGS from 'image-size'
import { ClientKOA } from '../../../koa/index.js'
import {
  AlemonJSError,
  AlemonJSLog,
  everyoneError
} from '../../../log/index.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { ClientController, ClientControllerOnMember } from '../controller.js'

export const C2C_MESSAGE_CREATE = async (event: USER_DATA) => {
  const cfg = getBotConfigByKey('ntqq')
  const masterID = cfg.masterID

  const Message = ClientController({
    guild_id: event.author.user_openid,
    msg_id: event.id
  })

  const Member = ClientControllerOnMember()

  const e = {
    platform: 'ntqq' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute: 'single' as 'group' | 'single',
    bot: getBotMsgByNtqq(),
    isMaster: event.author.id == masterID ? true : false,
    channel_id: event.author.user_openid, // 私聊重置为用户open编号
    guild_name: '',
    guild_avatar: '',
    channel_name: '',
    guild_id: event.author.user_openid,
    attachments: [],
    specials: [],
    //
    at_users: [],
    at_user: undefined,
    at: false,
    msg_txt: event.content,
    msg: event.content,
    msg_id: event.id,
    //
    user_id: event.author.id,
    user_name: '柠檬冲水',
    user_avatar: 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    segment: segmentNTQQ,
    send_at: new Date().getTime(),
    Member,
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
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
        event.id
      ).catch(everyoneError)
    },
    Message
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
