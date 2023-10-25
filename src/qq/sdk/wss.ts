import WebSocket from 'ws'
import { requestService } from './api.js'
import { getBotConfig } from './config.js'
import { getIntentsMask } from './intents.js'
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
      console.error('[AlemonJS]', '[http] err:', null)
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
export async function createClient(callBack: (...args: any[]) => any) {
  /**
   * 请求url
   */
  const gatewayUrl = await getGatewayUrl()
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
     * 存储最新的消息序号
     */
    let heartbeat_interval = 30000
    ws.on('message', msg => {
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
          callBack(data)
          if (t === 'READY') {
            // Ready Event，鉴权成功
            setInterval(() => {
              /**
               * 心跳定时发送
               */
              if (isConnected) {
                ws.send(
                  JSON.stringify({
                    op: 1, //  op = 1
                    d: null // 如果是第一次连接，传null
                  })
                )
              }
            }, heartbeat_interval)
          } else if (t === 'RESUMED') {
            // Resumed Event，恢复连接成功
          } else {
            // 处理不同类型的事件内容
          }
          break
        }
        case 7: {
          console.info(message)
          break
        }
        case 9: {
          console.info(message)
          break
        }
        case 10: {
          // OpCode 10 Hello 消息，处理心跳周期
          isConnected = true
          heartbeat_interval = data.heartbeat_interval
          const { appID, token, intents } = getBotConfig()
          /**
           * 发送鉴权
           */
          ws.send(
            JSON.stringify({
              op: 2, // op = 2
              d: {
                token: `Bot ${appID}.${token}`,
                intents: getIntentsMask(intents),
                shard: [0, 4],
                properties: {
                  $os: 'linux',
                  $browser: 'my_library',
                  $device: 'my_library'
                }
              }
            })
          )
          break
        }
        case 11: {
          // OpCode 11 Heartbeat ACK 消息，心跳发送成功
          console.info('[AlemonJS]', '心跳发送成功~')
          break
        }
        case 12: {
          console.info(12, message)
        }
      }
    })

    ws.on('close', () => {
      console.error('[AlemonJS]', '[ws] close')
    })
  }
}

/**

0	Dispatch	Receive	服务端进行消息推送
1	Heartbeat	Send/Receive	客户端或服务端发送心跳
2	Identify	Send	客户端发送鉴权
6	Resume	Send	客户端恢复连接
7	Reconnect	Receive	服务端通知客户端重新连接
9	Invalid Session	Receive	当identify或resume的时候，如果参数有错，服务端会返回该消息
10	Hello	Receive	当客户端与网关建立ws连接之后，网关下发的第一条消息
11	Heartbeat ACK	Receive/Reply	当发送心跳成功之后，就会收到该消息
12	HTTP Callback ACK	Reply	仅用于 http 回调模式的回包，代表机器人收到了平台推送的数据

 */
