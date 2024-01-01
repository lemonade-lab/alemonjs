import { ClientVILLA } from '../sdk/index.js'
import { everyoneError } from '../../log/index.js'
import IMGS from 'image-size'
import { BUFFER } from '../../core/index.js'

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
  msg: Buffer | string | number | (Buffer | number | string)[],
  select?: {
    quote?: string
    withdraw?: number
  }
) {
  // isBuffer
  if (Buffer.isBuffer(msg)) {
    // 上传图片
    const url = await ClientVILLA.uploadImage(villa_id, msg)
      .then(res => res?.data?.url)
      .catch(everyoneError)
    if (!url) return false
    const dimensions = IMGS.imageSize(msg)
    return await ClientVILLA.replyMessage(
      villa_id,
      room_id,
      {
        images: [
          {
            url,
            width: dimensions.width,
            height: dimensions.height
          }
        ]
      },
      select?.quote
    ).catch(everyoneError)
  }
  // isString arr and find buffer
  if (Array.isArray(msg) && msg.find(item => Buffer.isBuffer(item))) {
    const buffers = msg.filter(item => Buffer.isBuffer(item)) as Buffer[]
    const images: {
      url: string
      width?: number
      height?: number
    }[] = []
    for (const item of buffers) {
      const ISize = IMGS.imageSize(item)
      images.push({
        url: await ClientVILLA.uploadImage(villa_id, item)
          .then(res => res?.data?.url)
          .catch(everyoneError),
        width: ISize.width,
        height: ISize.height
      })
    }
    // 删除所有buffer
    const cont = msg
      .map(item => {
        if (typeof item === 'number') return String(item)
        return item
      })
      .filter(element => typeof element === 'string')
      .join('')
    return await ClientVILLA.replyMessage(
      villa_id,
      room_id,
      {
        msg: cont,
        images: images
      },
      select?.quote
    ).catch(everyoneError)
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
    // 先请求确保图片正常
    const msg = await BUFFER.getUrl(getUrl).catch(everyoneError)
    if (!msg) return false
    const dimensions = IMGS.imageSize(msg)
    // url 形式的直接转存
    const url = await ClientVILLA.transferImage(villa_id, getUrl)
      .then(res => res?.data?.new_url)
      .catch(everyoneError)
    // 如果是直接的url,应该直接使用转存
    const images = [
      {
        url,
        width: dimensions.width,
        height: dimensions.height
      }
    ]
    const contreplace = cont.replace(/<http>(.*?)<\/http>/, '')
    return await ClientVILLA.replyMessage(
      villa_id,
      room_id,
      {
        msg: contreplace == '' ? undefined : contreplace,
        images: images
      },
      select?.quote
    ).catch(everyoneError)
  }

  return await ClientVILLA.replyMessage(
    villa_id,
    room_id,
    {
      msg: cont
    },
    select?.quote
  ).catch(everyoneError)
}
