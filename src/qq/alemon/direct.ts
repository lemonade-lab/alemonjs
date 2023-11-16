import { getUrlbuffer } from '../../core/index.js'
import { ClientQQ as Client } from '../sdk/index.js'
import { everyoneError } from '../../log/index.js'
import { ControllerOption, UserInformationType } from '../../core/index.js'

/**
 * 客户端控制器
 * @param select
 * @returns
 */
export const ClientDirectController = (data: {
  guild_id: string
  channel_id: string
  msg_id: string
  send_at: number
}) => {
  return (select?: ControllerOption) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const msg_id = select?.msg_id ?? data.msg_id
    return {
      reply: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await directController(content, guild_id, msg_id)
      },
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return await directController(content, guild_id, msg_id)
      },
      /**
       * 更新信息
       * @param content
       * @returns
       */
      update: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {
        return false
      },
      withdraw: async (hideTip = true) => {
        return false
      },
      pinning: async (cancel?: boolean) => {
        return false
      },
      forward: async () => {
        return false
      },
      horn: async (cancel?: boolean) => {
        return false
      },
      emoji: async (msg: any[], cancel?: boolean) => {
        // 不同的场景下 api不同  私聊是不具有这么多功能的
        return []
      },
      card: async (msg: any[]) => {
        // 卡片消息
        return []
      },
      allEmoji: async () => {
        return false
      },
      allUsers: async (
        reactionObj: any,
        options = {
          cookie: '',
          limit: 20
        }
      ) => {
        return false
      }
    }
  }
}

/**
 * 回复控制器
 * @param msg
 * @param villa_id
 * @param room_id
 * @returns
 */
export async function directController(
  msg: Buffer | string | number | (Buffer | number | string)[],
  guild_id: string,
  msg_id: string,
  select?: {
    withdraw?: number
  }
) {
  // isBuffer

  // if withdraw == 0 ， false 不撤回
  if (Buffer.isBuffer(msg)) {
    try {
      return await Client.postDirectImage({
        id: guild_id,
        msg_id: msg_id, //消息id, 必须
        image: msg //buffer
      }).catch(everyoneError)
    } catch (err) {
      console.error(err)
      return err
    }
  }
  // arr && find buffer
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
      return await Client.postDirectImage({
        id: guild_id,
        msg_id: msg_id, //消息id, 必须
        image: msg[isBuffer] as Buffer, //buffer
        content: cont
      }).catch(everyoneError)
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
    if (msg) {
      return await Client.postImage({
        id: guild_id,
        msg_id: msg_id, //消息id, 必须
        image: msg //buffer
      }).catch(everyoneError)
    }
  }

  return await ClientQQ.directMessageApi
    .postDirectMessage(guild_id, {
      msg_id: msg_id,
      content
    })
    .catch(everyoneError)
}
