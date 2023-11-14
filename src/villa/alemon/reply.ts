import { ClientVILLA } from '../sdk/index.js'
import { everyoneError } from '../../log/index.js'
import IMGS from 'image-size'
import { getUrlbuffer } from '../../core/index.js'

/**
 * 回复控制器
 * @param msg
 * @param villa_id
 * @param room_id
 * @returns
 */
export async function replyController(
  villa_id: string | number,
  room_id: string | number,
  msg: Buffer | string | number | (Buffer | number | string)[]
) {
  /**
   * isBuffer
   */
  if (Buffer.isBuffer(msg)) {
    /**
     * 上传图片
     */
    const url = await ClientVILLA.uploadImage(villa_id, msg).then(
      res => res?.data?.url
    )
    if (!url) return false
    const dimensions = IMGS.imageSize(msg)
    return await ClientVILLA.sendMessageImage(villa_id, room_id, url, {
      width: dimensions.width,
      height: dimensions.height
    }).catch(everyoneError)
  }
  /**
   * isString arr and find buffer
   */
  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    // 找到其中一个buffer
    const isBuffer = msg.findIndex(item => Buffer.isBuffer(item))
    // 删除所有buffer
    const cont = msg
      .map(item => {
        if (typeof item === 'number') return String(item)
        return item
      })
      .filter(element => typeof element === 'string')
      .join('')
    // 字符解析器
    const { entities, content } = await ClientVILLA.stringParsing(
      cont,
      villa_id
    )
    /**
     * 上传图片
     */
    const url = await ClientVILLA.uploadImage(
      villa_id,
      msg[isBuffer] as Buffer
    ).then(res => res?.data?.url)
    if (!url) return false
    // 识别大小
    const dimensions = IMGS.imageSize(msg[isBuffer] as Buffer)
    if (entities.length == 0) {
      return await ClientVILLA.sendMessageTextUrl(
        villa_id,
        room_id,
        content,
        url,
        {
          width: dimensions.width,
          height: dimensions.height
        }
      ).catch(everyoneError)
    } else {
      return await ClientVILLA.sendMessageTextEntitiesUrl(
        villa_id,
        room_id,
        content,
        entities,
        url,
        {
          width: dimensions.width,
          height: dimensions.height
        }
      ).catch(everyoneError)
    }
  }
  // string and string[]
  const cont = Array.isArray(msg)
    ? msg.join('')
    : typeof msg === 'string'
    ? msg
    : typeof msg === 'number'
    ? `${msg}`
    : ''
  if (cont == '') return false

  /**
   * http
   */
  const match = cont.match(/<http>(.*?)<\/http>/)
  if (match) {
    const getUrl = match[1]
    const msg = await getUrlbuffer(getUrl)
    if (msg) {
      /**
       * 上传图片
       */
      const url = await ClientVILLA.uploadImage(villa_id, msg).then(
        res => res?.data?.url
      )
      if (!url) return false
      const dimensions = IMGS.imageSize(msg)
      return await ClientVILLA.sendMessageImage(villa_id, room_id, url, {
        width: dimensions.width,
        height: dimensions.height
      }).catch(everyoneError)
    }
  }
  /**
   * reply
   */
  const { entities, content } = await ClientVILLA.stringParsing(cont, villa_id)
  if (entities.length == 0 && content != '') {
    return await ClientVILLA.sendMessageText(villa_id, room_id, content).catch(
      everyoneError
    )
  } else if (entities.length != 0 && content != '') {
    return await ClientVILLA.sendMessageTextEntities(
      villa_id,
      room_id,
      content,
      entities
    ).catch(everyoneError)
  }
}
