import WebSocket from 'ws'
import { requestService } from './api.js'
import { getBotConfig } from './config.js'
import { getIntentsMask } from './intents.js'

/**
 *
 */
export type OpStart = {
  READY?: (event: any) => Promise<any>
  FRIEND_ADD?: (event: any) => Promise<any>
  GROUP_AT_MESSAGE_CREATE?: (event: any) => Promise<any>
  C2C_MESSAGE_CREATE?: (event: any) => Promise<any>
  INTERACTION_CREATE?: (event: any) => Promise<any>
}

/**
 * @param token  token
 * @returns
 */
export async function getGatewayUrl(): Promise<string | undefined> {
  try {
    const response = await requestService({
      url: '/gateway'
    }).then(res => res.data)
    if (response.url) {
      return response.url
    } else {
      console.error('[http] err:', null)
    }
  } catch (error) {
    console.error('[token] err:', error.message)
  }
}

let reconnectAttempts = 0 // 重新连接计数器

/**
 * 使用获取到的网关连接地址建立 WebSocket 连接
 * @param token
 * @param callBack
 */
export async function createClient(call: OpStart, shard = [0, 1]) {
  /**
   * 请求url
   */
  const gatewayUrl = await getGatewayUrl()

  // 重新连接的逻辑
  const reconnect = async () => {
    if (reconnectAttempts >= 5) {
      console.info('已达到最大重连次数，取消重新连接')
      return
    }

    console.info('正在重新连接...')
    // 延迟一段时间后发起重新连接
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 调用createClient函数重新建立连接
    await createClient(call, shard)

    reconnectAttempts++ // 递增重连计数器
  }

  if (gatewayUrl) {
    const ws = new WebSocket(gatewayUrl)
    ws.on('open', () => {
      console.info('[token] ok')
    })
    /**
     * 标记是否已连接
     */
    let isConnected = false
    /**
     * 存储最新的消息序号
     */
    let heartbeat_interval = 30000

    /**
     * 鉴权
     */

    let power

    /**
     * 监听消息
     */
    ws.on('message', async msg => {
      const message = JSON.parse(msg.toString('utf8'))
      /**
       * opcode
       *
       * s 标识消息的唯一性
       *
       * t 代表事件类型
       *
       * d 代表事件内容
       */
      const { op, s, d: data, t } = message
      // 根据 opcode 进行处理

      switch (op) {
        case 0: {
          console.log('[数据接收]', data)
          // 存在,则执行t对应的函数
          if (Object.prototype.hasOwnProperty.call(call, t)) {
            call[t](data)
          }

          // Ready Event，鉴权成功
          if (t === 'READY') {
            power = setInterval(() => {
              if (isConnected) {
                ws.send(
                  JSON.stringify({
                    op: 1, //  op = 1
                    d: null // 如果是第一次连接，传null
                  })
                )
              }
            }, heartbeat_interval)
          }

          // Resumed Event，恢复连接成功
          if (t === 'RESUMED') {
            console.info('恢复连接')
            // 重制次数
            reconnectAttempts = 0
          }
          break
        }
        case 6: {
          console.info('[连接尝试]', message)
          break
        }
        case 7: {
          // 执行重新连接
          console.info('[重新连接]', message)

          // 取消鉴权发送
          if (power) {
            clearInterval(power)
          }

          await reconnect()
          break
        }
        case 9: {
          console.info('[参数错误]', message)
          break
        }
        case 10: {
          // 重制次数
          isConnected = true
          heartbeat_interval = data.heartbeat_interval
          const { token, intents } = getBotConfig()
          /**
           * 发送鉴权
           */
          ws.send(
            JSON.stringify({
              op: 2, // op = 2
              d: {
                token: `QQBot ${token}`,
                intents: getIntentsMask(intents),
                shard,
                properties: {
                  $os: 'linux',
                  $browser: 'my_library',
                  $device: 'my_library'
                }
              }
            })
          )

          reconnectAttempts = 0
          break
        }
        case 11: {
          // OpCode 11 Heartbeat ACK 消息，心跳发送成功
          console.info('[心跳发送]', message)
          break
        }
        case 12: {
          console.info('[平台数据]', message)
        }
      }
    })

    ws.on('close', () => {
      console.info('[ws] close')
    })
  }
}

/**

1	Heartbeat	Send/Receive	客户端或服务端发送心跳
2	Identify	Send	客户端发送鉴权
6	Resume	Send	客户端恢复连接

0	Dispatch	Receive	服务端进行消息推送
7	Reconnect	Receive	服务端通知客户端重新连接
9	Invalid Session	Receive	当identify或resume的时候，如果参数有错，服务端会返回该消息
10	Hello	Receive	当客户端与网关建立ws连接之后，网关下发的第一条消息
11	Heartbeat ACK	Receive/Reply	当发送心跳成功之后，就会收到该消息
12	HTTP Callback ACK	Reply	仅用于 http 回调模式的回包，代表机器人收到了平台推送的数据

 */
