import { sendMessage } from './api.js'
import { type EntitiesType, type ImageSizeType } from './types.js'

/**
 * 图片发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param url 图片地址
 * @param size 图片配置
 * @returns
 */
export async function sendMessageImage(
  villa_id: number | string,
  room_id: number | string,
  url: string,
  size: ImageSizeType,
  user_id?: string
) {
  return await sendMessage(villa_id, {
    /**
     * 房间号
     */
    room_id,
    /**
     * 消息类型 */
    object_name: 'MHY:Image',
    /**
     *
     */
    msg_content: JSON.stringify({
      /**
       * 消息文本   支持  [爱心] 来转换成表情
       */
      content: {
        url,
        size
      }
    })
  })
}
/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @returns
 */
export async function sendMessageText(
  villa_id: number | string,
  room_id: number | string,
  text: string,
  user_id?: string
) {
  return await sendMessage(villa_id, {
    /**
     *  房间号
     */
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify({
      content: {
        text
      }
    })
  })
}
/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @param entities 渲染
 * @returns
 */
export async function sendMessageTextEntities(
  villa_id: number | string,
  room_id: number | string,
  text: string,
  entities: EntitiesType[],
  msg_id?: string
) {
  let data = {
    content: {
      text,
      entities
    }
  }

  if (msg_id) {
    const [id, at] = String(msg_id).split('.')
    data = {
      ...data,
      ...{
        quote: {
          original_message_id: id,
          original_message_send_time: at,
          quoted_message_id: id,
          quoted_message_send_time: at
        }
      }
    }
  }

  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify(data)
  })
}
/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @param url 图片
 * @param size 图片配置
 * @returns
 */
export async function sendMessageTextUrl(
  villa_id: number | string,
  room_id: number | string,
  text: string,
  url: string,
  size: ImageSizeType,
  msg_id?: string
) {
  let data = {
    content: {
      text,
      images: [
        {
          url,
          ...size
        }
      ]
    }
  }

  if (msg_id) {
    const [id, at] = String(msg_id).split('.')
    data = {
      ...data,
      ...{
        quote: {
          original_message_id: id,
          original_message_send_time: at,
          quoted_message_id: id,
          quoted_message_send_time: at
        }
      }
    }
  }

  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify(data)
  })
}

/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @param images 图片集
 * @returns
 */
export async function sendMessageTextImages(
  villa_id: number | string,
  room_id: number | string,
  text: string,
  images: any,
  msg_id?: string
) {
  let data = {
    content: {
      text,
      images
    }
  }

  if (msg_id) {
    const [id, at] = String(msg_id).split('.')
    data = {
      ...data,
      ...{
        quote: {
          original_message_id: id,
          original_message_send_time: at,
          quoted_message_id: id,
          quoted_message_send_time: at
        }
      }
    }
  }

  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify(data)
  })
}

/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @param entities 渲染
 * @param url 图片
 * @param size 图片配置
 * @returns
 */
export async function sendMessageTextEntitiesUrl(
  villa_id: number | string,
  room_id: number | string,
  text: string,
  entities: EntitiesType[],
  url: string,
  size: ImageSizeType,
  msg_id?: string
) {
  let data = {
    content: {
      text,
      entities,
      images: [
        {
          url,
          ...size
        }
      ]
    }
  }

  if (msg_id) {
    const [id, at] = String(msg_id).split('.')
    data = {
      ...data,
      ...{
        quote: {
          original_message_id: id,
          original_message_send_time: at,
          quoted_message_id: id,
          quoted_message_send_time: at
        }
      }
    }
  }

  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify(data)
  })
}
