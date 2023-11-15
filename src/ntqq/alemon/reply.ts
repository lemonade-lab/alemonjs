import { getUrlbuffer } from '../../core/index.js'
import { ClientNTQQ } from '../sdk/index.js'
import { ClientKOA } from '../../koa/index.js'
import IMGS from 'image-size'
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
  guild_id: string,
  msg_id: string
) {
  // is buffer
  if (Buffer.isBuffer(msg)) {
    try {
      const url = await ClientKOA.setLocalImg(msg)
      if (!url) return false
      return await ClientNTQQ.postFilesByGroup(guild_id, url).catch(
        everyoneError
      )
    } catch (err) {
      console.error(err)
      return err
    }
  }

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
      const dimensions = IMGS.imageSize(msg[isBuffer] as Buffer)
      const url = await ClientKOA.setLocalImg(msg[isBuffer] as Buffer)
      if (!url) return false
      return await ClientNTQQ.postMessageByGroup(
        guild_id,
        `${cont} ![text #${dimensions.width}px #${dimensions.height}px](${url})`,
        msg_id
      ).catch(everyoneError)
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
    if (Buffer.isBuffer(msg)) {
      const url = await ClientKOA.setLocalImg(msg)
      if (!url) return false
      return await ClientNTQQ.postFilesByGroup(guild_id, url).catch(
        everyoneError
      )
    }
  }

  return await ClientNTQQ.postMessageByGroup(guild_id, content, msg_id).catch(
    everyoneError
  )
}
