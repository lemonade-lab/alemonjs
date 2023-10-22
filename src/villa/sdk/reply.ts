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
  villa_id: number,
  room_id: number,
  url: string,
  size?: ImageSizeType
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
export async function sendMessageText(villa_id: number, room_id: number, text: string) {
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
  villa_id: number,
  room_id: number,
  text: string,
  entities: EntitiesType[]
) {
  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify({
      content: {
        text,
        entities
      }
    })
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
  villa_id: number,
  room_id: number,
  text: string,
  url: string,
  size?: ImageSizeType
) {
  const si = size ?? {}
  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify({
      content: {
        text,
        images: [
          {
            url,
            ...si
          }
        ]
      }
    })
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
  villa_id: number,
  room_id: number,
  text: string,
  images: any
) {
  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify({
      content: {
        text,
        images
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
 * @param url 图片
 * @param size 图片配置
 * @returns
 */
export async function sendMessageTextEntitiesUrl(
  villa_id: number,
  room_id: number,
  text: string,
  entities: EntitiesType[],
  url: string,
  size?: ImageSizeType
) {
  const si = size ?? {}
  return await sendMessage(villa_id, {
    room_id,
    object_name: 'MHY:Text',
    msg_content: JSON.stringify({
      content: {
        text,
        entities,
        images: [
          {
            url,
            ...si
          }
        ]
      }
    })
  })
}
