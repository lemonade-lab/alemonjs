import { ABuffer } from '../../core/index.js'
import { ClientKOOK } from '../sdk/index.js'

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
): Promise<{
  middle: any[]
  backhaul: any
}> {
  /**
   * isbuffer
   */
  if (Buffer.isBuffer(msg)) {
    const ret = await ClientKOOK.postImage(msg)
    if (ret && ret.data) {
      return {
        middle: [
          {
            url: ret.data.url
          }
        ],
        backhaul: await ClientKOOK.createMessage({
          type: 2,
          target_id: channel_id,
          content: ret.data.url
        })
      }
    }
    return {
      middle: [],
      backhaul: false
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
    if (!ret) {
      return {
        middle: [],
        backhaul: false
      }
    }

    if (ret?.data) {
      await ClientKOOK.createMessage({
        type: 9,
        target_id: channel_id,
        content: content
      })
      return {
        middle: [
          {
            url: ret.data.url
          }
        ],
        backhaul: await ClientKOOK.createMessage({
          type: 2,
          target_id: channel_id,
          content: ret.data.url
        })
      }
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
    if (!msg) {
      return {
        middle: [],
        backhaul: false
      }
    }

    const ret = await ClientKOOK.postImage(msg)
    if (!ret) {
      return {
        middle: [],
        backhaul: false
      }
    }

    if (msg && ret) {
      return {
        middle: [
          {
            url: ret.data.url
          }
        ],
        backhaul: await ClientKOOK.createMessage({
          type: 2,
          target_id: channel_id,
          content: ret.data.url
        })
      }
    }
  }
  return {
    middle: [],
    backhaul: await ClientKOOK.createMessage({
      type: 9,
      target_id: channel_id,
      content
    })
  }
}
