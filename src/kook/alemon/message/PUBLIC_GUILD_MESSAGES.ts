import {
  UserType,
  InstructionMatching,
  getUrlbuffer,
  PlatformEnum,
  EventEnum,
  EventType
} from '../../../core/index.js'
import { ClientKOOK, EventData } from '../../sdk/index.js'
import { segmentKOOK } from '../segment.js'
import { getBotMsgByKOOK } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import {
  AlemonJSError,
  AlemonJSLog,
  everyoneError
} from '../../../log/index.js'

/**
 *
 * @param event
 * @returns
 */
export const PUBLIC_GUILD_MESSAGES_KOOK = async (event: EventData) => {
  if (event.extra.author.bot) {
    return false
  }
  let at = false
  const at_users: UserType[] = []
  let msg = event.content
  /**
   * 艾特类型所得到的
   * 包括机器人在内
   */
  const mention_role_part = event.extra.kmarkdown?.mention_role_part ?? []
  for await (const item of mention_role_part) {
    at = true
    at_users.push({
      id: item.role_id,
      name: item.name,
      avatar: 'string',
      bot: true
    })
    msg = msg.replace(`(rol)${item.role_id}(rol)`, '').trim()
  }
  /**
   * 艾特用户所得到的
   */
  const mention_part = event.extra.kmarkdown?.mention_part ?? []
  for await (const item of mention_part) {
    at = true
    at_users.push({
      id: item.id,
      name: item.username,
      avatar: item.avatar,
      bot: false
    })
    msg = msg.replace(`(met)${item.id}(met)`, '').trim()
  }
  const cfg = getBotConfigByKey('kook')
  const masterID = cfg.masterID
  let at_user
  if (at) {
    if (at_users[0] && at_users[0].bot != true) {
      at_user = at_users[0]
    }
  }

  const avatar = event.extra.author.avatar

  const e = {
    /**
     * 基础声明
     */
    platform: 'kook' as (typeof PlatformEnum)[number],
    boundaries: 'private' as 'publick' | 'private',
    attribute:
      event.channel_type == 'GROUP'
        ? 'group'
        : ('single' as 'group' | 'single'),
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    bot: getBotMsgByKOOK(),
    /**
     *
     */
    isPrivate: true, //  kook没私域
    isRecall: false,
    isMaster: event.msg_id == masterID ? true : false,
    isGroup: event.channel_type == 'GROUP' ? true : false,
    at,
    at_users,
    at_user,
    msg,
    msg_id: event.msg_id,
    /**
     * 特殊消息
     */
    attachments: [],
    msg_txt: event.content,
    msg_create_time: event.msg_timestamp,
    guild_id: event.target_id,
    channel_id: event.extra.guild_id,
    user_id: event.extra.author.id,
    user_name: event.extra.author.username,
    user_avatar: avatar.substring(0, avatar.indexOf('?')),
    segment: segmentKOOK,
    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
      }
    ): Promise<any> => {
      /**
       * isbuffer
       */
      if (Buffer.isBuffer(msg)) {
        try {
          const ret = await ClientKOOK.postImage(msg)
          if (ret && ret.data) {
            if (event.channel_type == 'GROUP') {
              return await ClientKOOK.createMessage({
                type: 2,
                target_id: event.target_id,
                content: ret.data.url
              }).catch(everyoneError)
            }
            return await ClientKOOK.createDirectMessage({
              type: 2,
              target_id: event.target_id,
              chat_code: event.extra.code,
              content: ret.data.url
            }).catch(everyoneError)
          }
          return false
        } catch (err) {
          console.error(err)
          return err
        }
      }
      /**
       * string[] arr and find buffer
       */
      if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
        // 找到其中一个buffer
        const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
        // 删除所有buffer
        const content = msg
          .map(item => {
            if (typeof item === 'number') return String(item)
            return item
          })
          .filter(element => typeof element === 'string')
          .join('')
        // 转存
        const ret = await ClientKOOK.postImage(msg[isBuffer] as Buffer)
        if (!ret) return false
        if (ret?.data) {
          // 群
          if (event.channel_type == 'GROUP') {
            await ClientKOOK.createMessage({
              type: 9,
              target_id: event.target_id,
              content: content
            }).catch(err => err)
            return await ClientKOOK.createMessage({
              type: 2,
              target_id: event.target_id,
              content: ret.data.url
            }).catch(everyoneError)
          }
        }
        // 私聊
        await ClientKOOK.createDirectMessage({
          type: 9,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content: content
        })
        return await ClientKOOK.createDirectMessage({
          type: 2,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content: String(ret.data.url)
        }).catch(everyoneError)
      }
      const content = Array.isArray(msg)
        ? msg.join('')
        : typeof msg === 'string'
        ? msg
        : typeof msg === 'number'
        ? `${msg}`
        : ''

      if (content == '') return false

      const match = content.match(/<http>(.*?)<\/http>/)
      if (match) {
        const getUrl = match[1]
        const msg = await getUrlbuffer(getUrl)
        if (!msg) return false
        const ret = await ClientKOOK.postImage(msg)
        if (!ret) return false
        if (msg && ret) {
          if (event.channel_type == 'GROUP') {
            return await ClientKOOK.createMessage({
              type: 2,
              target_id: event.target_id,
              content: ret.data.url
            }).catch(everyoneError)
          }
          return await ClientKOOK.createDirectMessage({
            type: 2,
            target_id: event.target_id,
            chat_code: event.extra.code,
            content: ret.data.url
          }).catch(everyoneError)
        }
      }
      if (event.channel_type == 'GROUP') {
        try {
          return await ClientKOOK.createMessage({
            type: 9,
            target_id: event.target_id,
            content
          }).catch(everyoneError)
        } catch (err) {
          console.error(err)
          return err
        }
      }
      try {
        return await ClientKOOK.createDirectMessage({
          type: 9,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content
        }).catch(everyoneError)
      } catch (err) {
        console.error(err)
        return err
      }
    }
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
