import { BUFFER } from '../../core/index.js'
import { ClientKOOK } from '../sdk/index.js'
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
  channel_id: string
) {
  /**
   * isbuffer
   */
  if (Buffer.isBuffer(msg)) {
    const ret = await ClientKOOK.postImage(msg).catch(everyoneError)
    if (ret && ret.data) {
      return await ClientKOOK.createMessage({
        type: 2,
        target_id: channel_id,
        content: ret.data.url
      }).catch(everyoneError)
    }
    return false
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
    const ret = await ClientKOOK.postImage(msg[isBuffer] as Buffer).catch(
      everyoneError
    )
    if (!ret) return false
    if (ret?.data) {
      await ClientKOOK.createMessage({
        type: 9,
        target_id: channel_id,
        content: content
      }).catch(everyoneError)
      return await ClientKOOK.createMessage({
        type: 2,
        target_id: channel_id,
        content: ret.data.url
      }).catch(everyoneError)
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
    const msg = await BUFFER.getUrl(getUrl).catch(everyoneError)
    if (!msg) return false
    const ret = await ClientKOOK.postImage(msg).catch(everyoneError)
    if (!ret) return false
    if (msg && ret) {
      return await ClientKOOK.createMessage({
        type: 2,
        target_id: channel_id,
        content: ret.data.url
      }).catch(everyoneError)
    }
  }
  return await ClientKOOK.createMessage({
    type: 9,
    target_id: channel_id,
    content
  }).catch(everyoneError)
}
