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
  msg: Buffer | string | (Buffer | string)[],
  select?: {
    quote?: boolean
    withdraw?: boolean
  }
): Promise<boolean> => {
  const postSessionRes: any = await clientApiByQQ.directMessageApi
    .createDirectMessage({
      source_guild_id: EMessage.guild_id,
      recipient_id: EMessage.author.id
    })
    .catch((err: any) => {
      console.error(err)
      return err
    })

  if (!postSessionRes) return false

  const {
    data: { guild_id }
  } = postSessionRes
  if (!guild_id) return false
  // is Buffer
  if (Buffer.isBuffer(msg)) {
    try {
      return await Client.postDirectImage({
        id: EMessage.guild_id,
        msg_id: EMessage.id, //消息id, 必须
        image: msg //buffer
      }).catch((err: any) => {
        console.error(err)
        return err
      })
    } catch (err) {
      console.error(err)
      return err
    }
  }
  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
    const cont = msg.filter(element => typeof element === 'string').join('')
    try {
      return await Client.postDirectImage({
        id: EMessage.guild_id,
        msg_id: EMessage.id, //消息id, 必须
        image: msg[isBuffer] as Buffer, //buffer
        content: cont
      }).catch((err: any) => {
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
    : undefined
  return await clientApiByQQ.directMessageApi
    .postDirectMessage(guild_id, {
      msg_id: EMessage.id,
      content
    })
    .catch(err => {
      console.error(err)
      return err
    })
}
