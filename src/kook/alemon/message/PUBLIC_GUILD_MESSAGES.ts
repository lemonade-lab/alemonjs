import { AMessage, UserType, InstructionMatching } from 'alemon'
import { KOOKApiClient, EventData } from 'kook-ws'
import { segmentKOOK } from '../segment.js'
import { getBotMsgByKOOK } from '../bot.js'
import { getBotConfigByKey } from '../../../login.js'

/**
 *
 * @param event
 * @returns
 */
export const PUBLIC_GUILD_MESSAGES_KOOK = async (event: EventData) => {
  // console.info('interaction', interaction)
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
  const e = {
    platform: 'kook',
    bot: getBotMsgByKOOK(),
    event: 'MESSAGES',
    eventType: 'CREATE',
    /**
     * kook没私域
     */
    isPrivate: true,
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
    user_avatar: event.extra.author.avatar,
    segment: segmentKOOK,
    /**
     * 消息发送机制
     * @param content 消息内容
     * @param obj 额外消息 可选
     */
    reply: async (
      msg?: string | string[] | Buffer,
      img?: Buffer | string,
      name?: string
    ): Promise<boolean> => {
      if (Buffer.isBuffer(msg)) {
        try {
          const url = await KOOKApiClient.postImage(msg, typeof img == 'string' ? img : undefined)
          if (url) {
            if (event.channel_type == 'GROUP') {
              await KOOKApiClient.createMessage({
                type: 2,
                target_id: event.target_id,
                content: url
              })
              return true
            }
            await KOOKApiClient.createDirectMessage({
              type: 2,
              target_id: event.target_id,
              chat_code: event.extra.code,
              content: url
            })
            return true
          }
          return false
        } catch (err) {
          console.error(err)
          return false
        }
      }
      const content = Array.isArray(msg) ? msg.join('') : typeof msg === 'string' ? msg : undefined
      if (Buffer.isBuffer(img)) {
        try {
          const url = await KOOKApiClient.postImage(img, name)
          if (url) {
            if (event.channel_type == 'GROUP') {
              await KOOKApiClient.createMessage({
                type: 9,
                target_id: event.target_id,
                content: content
              })
              await KOOKApiClient.createMessage({
                type: 2,
                target_id: event.target_id,
                content: url
              })
              return true
            }
            await KOOKApiClient.createDirectMessage({
              type: 9,
              target_id: event.target_id,
              chat_code: event.extra.code,
              content: content
            })
            await KOOKApiClient.createDirectMessage({
              type: 2,
              target_id: event.target_id,
              chat_code: event.extra.code,
              content: url
            })
            return true
          }
          return false
        } catch (err) {
          console.error(err)
          return false
        }
      }
      if (event.channel_type == 'GROUP') {
        try {
          await KOOKApiClient.createMessage({
            type: 9,
            target_id: event.target_id,
            content
          })
          return true
        } catch {
          return false
        }
      }
      try {
        await KOOKApiClient.createDirectMessage({
          type: 9,
          target_id: event.target_id,
          chat_code: event.extra.code,
          content
        })
        return true
      } catch {
        return false
      }
    }
  } as AMessage

  await InstructionMatching(e)
    .then(() => {
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${true}] ${e.msg_txt}`)
      return true
    })
    .catch((err: any) => {
      console.error(err)
      console.info(`\n[${e.channel_id}] [${e.user_name}] [${false}] ${e.msg_txt}`)
      return false
    })
}
