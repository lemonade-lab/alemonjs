import { BufferData } from 'chat-space'
const BD = new BufferData()

let ClientONE = null

type Message = {
  // 行为 发送消息
  action: 'send_message'
  params: {
    // 私聊回复
    detail_type: 'private'
    // 用户
    user_id: number
    // 消息体
    message: (
      | {
          type: 'image'
          data: {
            file_id: string
          }
        }
      | {
          type: 'text'
          data: {
            text: string
          }
        }
    )[]
  }
  echo: '1234'
}

/**
 * 回复控制器
 * @param msg
 * @param villa_id
 * @param room_id
 * @returns
 */
export async function directController(msg, user_id) {
  // is buffer
  if (Buffer.isBuffer(msg)) {
    try {
      ClientONE.send(
        JSON.stringify({
          // 行为 发送消息
          action: 'send_message',
          params: {
            // 私聊回复
            detail_type: 'private',
            // 用户
            user_id: user_id,
            // 消息体
            message: [
              {
                type: 'image',
                data: {
                  file_id: `base64://${msg.toString('base64')}`
                }
              }
            ]
          },
          echo: '1234'
        } as Message)
      )
      return false
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
      const buff = msg[isBuffer]
      ClientONE.send(
        JSON.stringify({
          // 行为 发送消息
          action: 'send_message',
          params: {
            // 私聊回复
            detail_type: 'private',
            // 用户
            user_id: user_id,
            // 消息体
            message: [
              {
                type: 'text',
                data: {
                  text: cont
                }
              },
              {
                type: 'image',
                data: {
                  file_id: `base64://${buff.toString('base64')}`
                }
              }
            ]
          },
          echo: '1234'
        } as Message)
      )
      return false
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
    // url
    //
    const msg = await BD.getUrl(getUrl)
    if (Buffer.isBuffer(msg)) {
      ClientONE.send(
        JSON.stringify({
          // 行为 发送消息  send_group_msg
          action: 'send_message',
          params: {
            // 私聊回复
            detail_type: 'private',
            // 用户
            user_id: user_id,
            // 消息体
            message: [
              {
                type: 'image',
                data: {
                  file_id: `base64://${msg.toString('base64')}`
                }
              }
            ]
          },
          echo: '1234'
        } as Message)
      )
    }
  }
  /**
   * 需要增加解析器
   * <@xxxx>  <@everyone>
   */
  ClientONE.send(
    JSON.stringify({
      // 行为 发送消息
      action: 'send_message',
      params: {
        // 私聊回复
        detail_type: 'private',
        // 用户
        user_id: user_id,
        // 消息体
        message: [
          {
            type: 'text',
            data: {
              text: content
            }
          }
        ]
      },
      echo: '1234'
    } as Message)
  )
  return true
}
