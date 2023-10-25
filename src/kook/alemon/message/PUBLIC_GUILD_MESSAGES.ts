import {
  AMessage,
  UserType,
  InstructionMatching,
  getUrlbuffer
} from '../../../core/index.js'
import { KOOKApiClient, EventData } from '../../sdk/index.js'
import { segmentKOOK } from '../segment.js'
import { getBotMsgByKOOK } from '../bot.js'
import { getBotConfigByKey } from '../../../config/index.js'
import { AlemonJSError, AlemonJSLog } from 'src/log/user.js'

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
  let isMaster = false
  const cfg = getBotConfigByKey('kook')
  const masterID = cfg.masterID
  if (event.msg_id == masterID) {
    isMaster = true
  }
  let at_user
  if (at) {
    if (at_users[0] && at_users[0].bot != true) {
      at_user = at_users[0]
    }
  }

  const avatar = event.extra.author.avatar

  const e = {
    platform: 'kook',
    bot: getBotMsgByKOOK(),
    event: 'MESSAGES',
    eventType: 'CREATE',
    isPrivate: true, //  kook没私域
    isRecall: false,
    isMaster: isMaster,
    isGroup: event.channel_type == 'GROUP' ? true : false,
    at,
    at_users,
    at_user,
    msg,
    msg_id: event.msg_id,
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
      msg: Buffer | string | (Buffer | string)[],
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
          const url = await KOOKApiClient.postImage(msg)
          if (url) {
            if (event.channel_type == 'GROUP') {
              return await KOOKApiClient.createMessage({
                type: 2,
                target_id: event.target_id,
                content: url
              }).catch(err => {
                console.log(err)
                return err
              })
            }
            return await KOOKApiClient.createDirectMessage({
              type: 2,
              target_id: event.target_id,
              chat_code: event.extra.code,
              content: url
            }).catch(err => {
              console.log(err)
              return err
            })
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
          .filter(element => typeof element === 'string')
          .join('')
        // 转存
        const url = await KOOKApiClient.postImage(msg[isBuffer])
        if (url) {
          // 群
          if (event.channel_type == 'GROUP') {
            await KOOKApiClient.createMessage({
              type: 9,
              target_id: event.target_id,
              content: content
            }).catch(err => err)
            return await KOOKApiClient.createMessage({
              type: 2,
              target_id: event.target_id,
              content: url
            }).catch(err => {
              console.log(err)
              return err
            })
          }
        }
        // 私聊
        await KOOKApiClient.createDirectMessage({
          type: 9,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content: content
        })
        return await KOOKApiClient.createDirectMessage({
          type: 2,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content: String(url)
        }).catch(err => {
          console.log(err)
          return err
        })
      }
      const content = Array.isArray(msg)
        ? msg.join('')
        : typeof msg === 'string'
        ? msg
        : ''

      if (content == '') {
        return false
      }

      const match = content.match(/<http>(.*?)<\/http>/)
      if (match) {
        const getUrl = match[1]
        const msg = await getUrlbuffer(getUrl)
        const url = await KOOKApiClient.postImage(msg)
        if (msg && url) {
          if (event.channel_type == 'GROUP') {
            return await KOOKApiClient.createMessage({
              type: 2,
              target_id: event.target_id,
              content: url
            }).catch(err => {
              console.log(err)
              return err
            })
          }
          return await KOOKApiClient.createDirectMessage({
            type: 2,
            target_id: event.target_id,
            chat_code: event.extra.code,
            content: url
          }).catch(err => {
            console.log(err)
            return err
          })
        }
      }
      if (event.channel_type == 'GROUP') {
        try {
          return await KOOKApiClient.createMessage({
            type: 9,
            target_id: event.target_id,
            content
          }).catch(err => {
            console.log(err)
            return err
          })
        } catch (err) {
          console.log(err)
          return err
        }
      }
      try {
        return await KOOKApiClient.createDirectMessage({
          type: 9,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content
        }).catch(err => {
          console.log(err)
          return err
        })
      } catch (err) {
        console.log(err)
        return err
      }
    }
  } as AMessage

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
