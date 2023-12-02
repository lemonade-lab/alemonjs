import { sendMessage } from './api.js'
import { stringParsing } from './mechanism.js'
import { type MHYEnum, type StringifyType, type PanelType } from './types.js'

/**
 * 数据序列化
 * @param data
 * @returns
 */
export function stringify(data: StringifyType) {
  return JSON.stringify(data)
}

/**
 * 消息发送
 * @param villa_id 别野
 * @param room_id 房间
 * @param m {msg:文本 images:{ url size }}
 * @param msg_id 消息编号
 * @returns
 */
export async function replyMessage(
  villa_id: number | string,
  room_id: number | string,
  m: {
    msg?: string
    images?: {
      url: string
      width?: number
      height?: number
    }[]
    panel?: PanelType
  },
  msg_id?: string
) {
  const data = {
    content: undefined,
    panel: m?.panel,
    quote: undefined
  }
  let object_name: (typeof MHYEnum)[number] = 'MHY:Text'
  if (m?.msg || m?.images?.length > 1) {
    // 文字模式
    const { entities, content } = await stringParsing(m.msg, villa_id)
    data.content = {
      text: content,
      entities,
      images: m?.images ?? []
    }
  } else {
    // 图片模式
    data.content = {
      url: m.images[0].url,
      size:
        m.images[0]?.width && m.images[0]?.height
          ? {
              width: m.images[0]?.width,
              height: m.images[0]?.height
            }
          : undefined
    }
    object_name = 'MHY:Image'
  }
  if (msg_id) {
    const [id, at] = String(msg_id).split('.')
    data.quote = {
      original_message_id: id,
      original_message_send_time: Number(at),
      quoted_message_id: id,
      quoted_message_send_time: Number(at)
    }
  }
  return await sendMessage(villa_id, {
    room_id,
    object_name: object_name,
    msg_content: stringify(data)
  })
}
