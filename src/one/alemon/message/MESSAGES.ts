import { WebSocket } from 'ws'
import { EventGroup } from '../../sdk/types.js'
import { getBotConfigByKey } from '../../../config/index.js'
import {
  AMessage,
  CardType,
  InstructionMatching,
  getUrlbuffer
} from '../../../core/index.js'
import { getBotMsgByONE } from '../bot.js'
import { segmentONE } from '../segment.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
/**
 * 公信事件
 * @param socket
 * @param event
 * @returns
 */
export async function MESSAGES(socket: WebSocket, event: EventGroup) {
  const cfg = getBotConfigByKey('one')
  const masterID = cfg.masterID
  const e = {
    platform: 'one',
    bot: getBotMsgByONE(),
    isMaster: event.user_id == masterID ? true : false,
    event: 'MESSAGES',
    eventType: 'CREATE',
    // 撤回
    isRecall: false,
    boundaries: 'publick',
    isGroup: event.detail_type == 'private' ? true : false,
    // 是私
    isPrivate: event.detail_type == 'private' ? true : false,
    // 是私聊
    attribute: event.detail_type == 'private' ? 'single' : 'group'
  } as AMessage

  /**
   * 消息发送机制
   * @param msg 消息
   * @param img
   * @returns
   */
  e.reply = async (
    msg: Buffer | string | number | (Buffer | number | string)[],
    select?: {
      quote?: string
      withdraw?: number
    }
  ): Promise<any> => {
    // is buffer
    if (Buffer.isBuffer(msg)) {
      try {
        socket.send(
          JSON.stringify({
            // 行为 发送消息
            action: 'send_group_msg',
            params: {
              group_id: event.group_id,
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
          })
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
        const buff = msg[isBuffer] as Buffer
        socket.send(
          JSON.stringify({
            // 行为 发送消息
            action: 'send_group_msg',
            params: {
              group_id: event.group_id,
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
          })
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
      const msg = await getUrlbuffer(getUrl)
      if (Buffer.isBuffer(msg)) {
        // 群聊
        socket.send(
          JSON.stringify({
            action: 'send_group_msg',
            params: {
              group_id: event.group_id,
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
          })
        )
      }
    }
    const message = []

    /**
     * content中包含这些需要提取出来
     * 同时保存原字符串顺序不变
     * <@user_id>  <@everyone>
     */

    /**
     *  {
        type: 'text',
        data: {
          text: content
        }
      }
     */

    /**
     * {
    "type": "mention",
    "data": {
        "user_id": "1234567"
    }
}
     */

    /**
     * {
    "type": "mention_all",
    "data": {}
}
     */

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

    socket.send(
      JSON.stringify({
        action: 'send_group_msg',
        params: {
          group_id: event.group_id,
          message: message
        },
        echo: '1234'
      })
    )
    return true
  }

  e.replyCard = async (arr: CardType[]) => {
    for (const item of arr) {
      try {
        if (item.type == 'qq_ark' || item.type == 'qq_embed') {
          console.info('temporarily unavailable')
          return false
        }
        return false
      } catch (err) {
        console.error(err)
        return err
      }
    }
    return true
  }

  /**
   * 发送表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.replyEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.info('temporarily unavailable')
    return false
  }

  /**
   * 删除表情表态
   * @param mid
   * @param boj { emoji_type: number; emoji_id: string }
   * @returns
   */
  e.deleteEmoji = async (
    mid: string,
    boj: { emoji_type: number; emoji_id: string }
  ): Promise<boolean> => {
    console.info('temporarily unavailable')
    return false
  }

  /**
   * 消息原文
   */
  e.msg_txt = event.raw_message

  /**
   * 用户编号
   */
  e.user_id = event.user_id

  /**
   * 用户头像
   */
  e.user_avatar =
    event.platform == 'qq'
      ? `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`
      : 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638'

  /**
   * 用户名
   */
  e.user_name = event.sender.nickname

  /**
   * 子频道编号
   */
  e.channel_id = event.group_id

  /**
   * 编号
   */
  e.guild_id = event.group_id
  /**
   * 群名
   */
  e.guild_name = event.group_name
  /**
   * 模块
   */
  e.segment = segmentONE

  /**
   * 被艾特的用户
   */
  e.at_users = []

  const arr: {
    qq: number
    text: string
    user_id: number
  }[] = []

  for (const item of event.message) {
    if (item.type == 'mention') {
      arr.push(item.data)
      e.at_users.push({
        avatar: '',
        bot: false,
        id: item.data.user_id,
        name: item.data.text.replace(/^@/, '')
      })
    }
  }

  /**
   * 消息
   */
  e.msg = event.raw_message.trim()

  for (const item of arr) {
    e.msg = e.msg.replace(item.text, '').trim()
  }

  /**
   * 消息编号
   */
  e.msg_id = event.message_id

  /**
   * 艾特消息处理
   */
  e.at = false

  /**
   * 存在at
   */
  if (e.at) {
    /**
     * 得到第一个艾特
     */
    e.at_user = e.at_users.find(item => item.bot != true)
  }

  /**
   * 业务处理
   */
  return await InstructionMatching(e)
    .then(() => AlemonJSLog(e.channel_id, e.user_name, e.msg_txt))
    .catch(err => AlemonJSError(err, e.channel_id, e.user_name, e.msg_txt))
}
