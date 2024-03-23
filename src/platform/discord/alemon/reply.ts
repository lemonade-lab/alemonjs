import { ABuffer } from '../../../core/index.js'
import { ClientDISOCRD } from '../sdk/index.js'

/**
 * 回复控制器
 * @param msg
 * @param channel_id
 * @param select
 * @returns
 */
export async function replyController(
  msg: Buffer | string | number | (Buffer | number | string)[],
  channel_id: string,
  select?: {
    quote?: string
    withdraw?: number
  }
): Promise<{
  middle: any[]
  backhaul: any
}> {
  if (Buffer.isBuffer(msg)) {
    return {
      middle: [],
      backhaul: await ClientDISOCRD.channelsMessagesImage(channel_id, msg)
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
    return {
      middle: [],
      backhaul: await ClientDISOCRD.channelsMessagesImage(
        channel_id,
        msg[isBuffer],
        cont
      )
    }
  }
  const content = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : typeof msg === 'number'
    ? `${msg}`
    : ''

  if (content == '') {
    return {
      middle: [],
      backhaul: false
    }
  }

  const match = content.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await ABuffer.getUrl(getUrl)
    if (msg) {
      return {
        middle: [],
        backhaul: await ClientDISOCRD.channelsMessagesImage(channel_id, msg)
      }
    }
  }

  return {
    middle: [],
    backhaul: await ClientDISOCRD.channelsMessages(channel_id, {
      content: content
    })
  }
}
