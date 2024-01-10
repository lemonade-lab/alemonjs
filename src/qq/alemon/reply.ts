import { BUFFER } from '../../core/index.js'
import { ClientQQ } from '../sdk/index.js'

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
  msg_id: string,
  select?: {
    quote?: string
    withdraw?: number
  }
) {
  // isBuffer

  // if withdraw == 0 ， false 不撤回

  if (Buffer.isBuffer(msg)) {
    return await ClientQQ.postImage(channel_id, {
      msg_id: msg_id, //消息id, 必须,不然就是主动消息了
      image: msg //buffer
    })
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
    return await ClientQQ.postImage(channel_id, {
      msg_id: msg_id, //消息id, 必须
      image: msg[isBuffer] as Buffer, //buffer
      content: cont
    })
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
    const msg = await BUFFER.getUrl(getUrl)
    if (msg) {
      return await ClientQQ.postImage(channel_id, {
        msg_id: msg_id, //消息id, 必须
        image: msg //buffer
      })
    }
  }

  /**
   * 发送接口
   */
  return ClientQQ.channelsMessagesPost(channel_id, {
    content,
    msg_id
  })
}
