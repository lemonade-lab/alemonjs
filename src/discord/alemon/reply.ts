import { getUrlbuffer } from '../../core/index.js'
import { ClientDISOCRD as Client } from '../sdk/index.js'
import { everyoneError } from '../../log/index.js'

/**
 * 回复控制器
 * @param msg
 * @param villa_id
 * @param room_id
 * @returns
 */
export async function replyController(
  msg: Buffer | string | number | (Buffer | number | string)[],
  channel_id: string,
  select?: {
    quote?: string
    withdraw?: number
  }
) {
  if (Buffer.isBuffer(msg)) {
    try {
      return await Client.channelsMessagesImage(channel_id, msg)
    } catch (err) {
      console.error(err)
      return err
    }
  }

  // arr & find buffer
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
      return await Client.channelsMessagesImage(channel_id, msg[isBuffer], cont)
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

  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await getUrlbuffer(getUrl)
    if (msg) {
      return await Client.channelsMessagesImage(channel_id, msg)
    }
  }

  return Client.channelsMessages(channel_id, {
    content: content
  }).catch(everyoneError)
}
