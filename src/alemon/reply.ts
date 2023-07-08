import { sendMessage } from '../sdk/api.js'
import { MHYType } from '../sdk/types.js'
/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @returns
 */
export async function sendMessageText(villa_id, room_id, text) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
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
export async function sendMessageTextEntities(villa_id, room_id, text, entities) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text,
        entities
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}
/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @param url 图片
 * @returns
 */
export async function sendMessageTextUrl(villa_id, room_id, text, url) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text,
        images: [
          {
            url,
            with: '1080',
            height: '2200'
          }
        ]
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}
/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param text 文本
 * @param entities 渲染
 * @param url 图片
 * @returns
 */
export async function sendMessageTextEntitiesUrl(villa_id, room_id, text, entities, url) {
  return await sendMessage(villa_id, {
    room_id, //房间号
    object_name: MHYType.Text, // 消息类型
    msg_content: JSON.stringify({
      content: {
        // 消息文本   支持  [爱心] 来转换成表情
        text,
        entities,
        images: [
          {
            url,
            with: '1080',
            height: '2200'
          }
        ]
      }
    }) // 要回复的消息
  }).catch(err => {
    console.log(err)
    return false
  })
}
