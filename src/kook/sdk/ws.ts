import WebSocket from 'ws'
import axios from 'axios'
import { setKookToken } from './config.js'
import { EventData, SystemData } from './typings.js'

/**
 *
 * @param token  token
 * @param url 请求地址
 * @param compress 下发数据是否压缩，默认为1，代表压缩
 * @returns
 */
export async function getGatewayUrl(
  token: string,
  url = 'https://www.kookapp.cn/api/v3/gateway/index',
  compress = 0
): Promise<string | undefined> {
  /**
   * 替换为实际的接口地址
   */
  const Authorization = `Bot ${token}`
  try {
    const response = await axios.get(url, {
      params: {
        compress: compress
      },
      headers: {
        Authorization: Authorization
      }
    })
    if (response.data.code === 0) {
      return response.data.data.url
    } else {
      console.error('[AlemonJS]', '[http] err:', response.data.message)
    }
  } catch (error) {
    console.error('[AlemonJS]', '[token] err:', error.message)
  }
}

/**
 * 使用获取到的网关连接地址建立 WebSocket 连接
 * @param token
 * @param callBack
 */
export async function createClient(
  token: string,
  callBack: (...args: any[]) => any
) {
  /**
   * 设置token
   */
  setKookToken(token)
  /**
   * 请求url
   */
  const gatewayUrl = await getGatewayUrl(token)
  if (gatewayUrl) {
    const ws = new WebSocket(gatewayUrl)
    ws.on('open', () => {
      console.info('[AlemonJS]', '[token] ok')
    })

    /**
     * 标记是否已连接
     */
    let isConnected = false
    /**
     * 存储 session ID
     */
    let sessionID = ''
    /**
     * 存储最新的消息序号
     */
    let lastMessageSN = 0

    ws.on('message', msg => {
      /**
       *
       */
      const message = JSON.parse(msg.toString('utf8'))

      /**
       *
       */
      const { s, d: data, sn } = message

      switch (s) {
        /**
         * 消息(包含聊天和通知消息)
         */
        case 0: {
          /**
           * 处理 EVENT 信令
           * 包括按序处理消息和记录最新的消息序号
           */
          if (data && sn) {
            if (sn === lastMessageSN + 1) {
              /**
               * 消息序号正确
               * 按序处理消息
               */
              lastMessageSN = sn
              /**
               * 处理消息并传递给almeon
               */

              const event: EventData | SystemData = data

              callBack(event)
            } else if (sn > lastMessageSN + 1) {
              /**
               * 消息序号乱序
               * 存入暂存区等待正确的序号处理
               * 存入暂存区
               */
            }
            /**
             * 如果收到已处理过的消息序号
             * 则直接丢弃
             */
          }
          break
        }
        /**
         * 客户端连接 ws 时,
         * 服务端返回握手结果
         */
        case 1: {
          if (data && data.code === 0) {
            console.info('[AlemonJS]', '[ws] ok')
            sessionID = data.session_id
            isConnected = true
          } else {
            console.info('[AlemonJS]', '[ws] err')
          }
          break
        }
        /**
         * 心跳，ping
         */
        case 2: {
          console.info('[AlemonJS]', '[ws] ping')
          ws.send(
            JSON.stringify({
              s: 3
            })
          )
          break
        }
        /**
         * 心跳，pong
         */
        case 3: {
          console.info('[AlemonJS]', '[ws] pong')
          break
        }
        /**
         * resume, 恢复会话
         */
        case 4: {
          console.info('[AlemonJS]', '[ws] resume')
          break
        }
        /**
         * reconnect, 要求客户端断开当前连接重新连接
         */
        case 5: {
          console.info('[AlemonJS]', '[ws] Connection failed, reconnect')
          /**
           * 处理 RECONNECT 信令
           * 断开当前连接并进行重新连接
           */
          isConnected = false
          /**
           *
           */
          sessionID = ''
          /**
           * 清空本地的 sn 计数和消息队列
           */
          break
        }
        /**
         * resume ack
         */
        case 6: {
          console.info('[AlemonJS]', '[ws] resume ack')
          break
        }
        default: {
          console.info('[AlemonJS]', '[ws] 默认')
          break
        }
      }
    })

    /**
     * 心跳定时发送
     */
    setInterval(() => {
      if (isConnected) {
        ws.send(
          JSON.stringify({
            s: 2,
            sn: lastMessageSN
          })
        )
      }
    }, 30000)

    ws.on('close', () => {
      console.error('[AlemonJS]', '[ws] close')
    })
  }
}
