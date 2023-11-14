import { Event } from '../../sdk/types.js'
import { getBotConfigByKey } from '../../../config/index.js'
import {
  EventEnum,
  EventType,
  InstructionMatching,
  PlatformEnum,
  getUrlbuffer
} from '../../../core/index.js'
import { getBotMsgByONE } from '../bot.js'
import { segmentONE } from '../segment.js'
import { AlemonJSError, AlemonJSLog } from '../../../log/index.js'
import { ClientONE } from '../../sdk/wss.js'
import { ClientController } from '../controller.js'
/**
 * 公信事件
 * @param socket
 * @param event
 * @returns
 */
export async function DIRECT_MESSAGE(event: Event) {
  const cfg = getBotConfigByKey('one')
  const masterID = cfg.masterID

  const controller = ClientController({
    guild_id: '0',
    channel_id: '0',
    msg_id: event.message_id,
    send_at: new Date().getTime()
  })

  const e = {
    platform: 'one' as (typeof PlatformEnum)[number],
    event: 'MESSAGES' as (typeof EventEnum)[number],
    eventType: 'CREATE' as (typeof EventType)[number],
    boundaries: 'publick' as 'publick' | 'private',
    attribute:
      event.detail_type == 'private'
        ? 'single'
        : ('group' as 'group' | 'single'),
    bot: getBotMsgByONE(),
    isMaster: event.user_id == masterID ? true : false,
    isRecall: false,
    isGroup: event.detail_type == 'private' ? true : false,
    isPrivate: event.detail_type == 'private' ? true : false,
    msg_txt: event.raw_message,
    msg: event.raw_message.trim(),
    msg_id: event.message_id,
    user_id: event.user_id,
    user_avatar:
      event.platform == 'qq'
        ? `https://q1.qlogo.cn/g?b=qq&s=0&nk=${event.user_id}`
        : 'https://q1.qlogo.cn/g?b=qq&s=0&nk=1715713638',
    user_name: event.sender.nickname,
    channel_id: '',
    guild_id: '',
    segment: segmentONE,
    at_users: [],
    attachments: [],
    specials: [],
    send_at: new Date().getTime(),
    at: false,
    at_user: undefined,
    controller,
    /**
     * 消息发送机制
     * @param msg 消息
     * @param img
     * @returns
     */
    reply: async (
      msg: Buffer | string | number | (Buffer | number | string)[],
      select?: {
        quote?: string
        withdraw?: number
        guild_id?: string
        channel_id?: string
      }
    ): Promise<any> => {
      // is buffer
      if (Buffer.isBuffer(msg)) {
        try {
          ClientONE.send(
            JSON.stringify({
              // 行为 发送消息
              action: 'send_message',
              params: {
                // 私聊回复
                detail_type: event.detail_type,
                // 用户
                user_id: event.user_id,
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
          ClientONE.send(
            JSON.stringify({
              // 行为 发送消息
              action: 'send_message',
              params: {
                // 私聊回复
                detail_type: event.detail_type,
                // 用户
                user_id: event.user_id,
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
          if (event.detail_type == 'private') {
            ClientONE.send(
              JSON.stringify({
                // 行为 发送消息  send_group_msg
                action: 'send_message',
                params: {
                  // 私聊回复
                  detail_type: event.detail_type,
                  // 用户
                  user_id: event.user_id,
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
          } else {
            // 群聊
            ClientONE.send(
              JSON.stringify({
                action: 'send_group_msg',
                params: {
                  group_id: '',
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
            detail_type: event.detail_type,
            // 用户
            user_id: event.user_id,
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
        })
      )
      return true
    }
  }

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
