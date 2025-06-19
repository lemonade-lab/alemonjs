import { getBufferByURL } from 'alemonjs/utils'

type Message = {
  // 行为 发送消息
  action: 'send_group_msg'
  params: {
    // 用户
    group_id: number
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
      | {
          type: 'mention'
          data: {
            user_id: number
          }
        }
      | {
          type: 'mention_all'
          data: any
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
export async function replyController(msg, guild_id) {
  // is buffer
  if (Buffer.isBuffer(msg)) {
    try {
      global.client.send(
        JSON.stringify({
          // 行为 发送消息
          action: 'send_group_msg',
          params: {
            group_id: guild_id,
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
      global.client.send(
        JSON.stringify({
          // 行为 发送消息
          action: 'send_group_msg',
          params: {
            group_id: guild_id,
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
    const msg = await getBufferByURL(getUrl)
    if (Buffer.isBuffer(msg)) {
      // 群聊
      global.client.send(
        JSON.stringify({
          action: 'send_group_msg',
          params: {
            group_id: guild_id,
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
  const message = []
  const mentionRegex = /<@(\w+)>/g
  const mentionAllRegex = /<@everyone>/g
  let matchCentnt
  let lastIndex = 0
  while ((matchCentnt = mentionRegex.exec(content)) !== null) {
    const user_id = matchCentnt[1]
    const textBeforeMention = content.substring(lastIndex, matchCentnt.index)
    if (textBeforeMention) {
      message.push({
        type: 'text',
        data: {
          text: textBeforeMention
        }
      })
    }
    if (user_id != 'everyone') {
      message.push({
        type: 'mention',
        data: {
          user_id
        }
      })
    }
    lastIndex = mentionRegex.lastIndex
  }
  const remainingText = content.substring(lastIndex)
  if (remainingText) {
    message.push({
      type: 'text',
      data: {
        text: remainingText
      }
    })
  }
  if (mentionAllRegex.test(content)) {
    message.push({
      type: 'mention_all',
      data: {}
    })
  }
  global.client.send(
    JSON.stringify({
      action: 'send_group_msg',
      params: {
        group_id: guild_id,
        message: message
      },
      echo: '1234'
    } as Message)
  )
  return true
}
