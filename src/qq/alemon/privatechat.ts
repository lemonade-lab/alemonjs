import { IOpenAPI } from 'qq-guild-bot'
import { ClientAPIByQQ as Client } from '../sdk/index.js'
import { QQEMessage } from './types.js'

declare global {
  var clientApiByQQ: IOpenAPI
}

/**
 * 公信转私信
 * @param EMessage
 * @param msg
 * @param img
 * @returns
 */
export const Private = async (
  EMessage: QQEMessage,
  msg?: string | string[] | Buffer,
  img?: Buffer | string,
  name?: string
): Promise<boolean> => {
  const postSessionRes: any = await clientApiByQQ.directMessageApi
    .createDirectMessage({
      source_guild_id: EMessage.guild_id,
      recipient_id: EMessage.author.id
    })
    .catch((err: any) => {
      console.error(err)
      return false
    })

  if (!postSessionRes) return false

  const {
    data: { guild_id }
  } = postSessionRes

  if (!guild_id) return false

  if (Buffer.isBuffer(msg)) {
    try {
      return await Client.postDirectImage({
        id: EMessage.guild_id,
        msg_id: EMessage.id, //消息id, 必须
        image: msg, //buffer
        name: typeof img == 'string' ? img : undefined
      })
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
  const content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : undefined
  if (Buffer.isBuffer(img)) {
    try {
      return await Client.postDirectImage({
        id: EMessage.guild_id,
        msg_id: EMessage.id, //消息id, 必须
        image: img, //buffer
        content: content,
        name: name
      })
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

  return await clientApiByQQ.directMessageApi
    .postDirectMessage(guild_id, {
      msg_id: EMessage.id,
      content
    })
    .then(() => true)
    .catch(err => {
      console.error(err)
      return false
    })
}
