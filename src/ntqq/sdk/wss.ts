import WebSocket from 'ws'
import { gateway } from './api/index.js'
import { getBotConfig } from './config.js'

let reconnectAttempts = 0 // 重新连接计数器

/**
 * 使用获取到的网关连接地址建立 WebSocket 连接
 * @param token
 * @param callBack
 */
export async function createClient(
  conversation: (...args: any[]) => any,
  shard = [0, 1]
) {
  /**
   * 请求url
   */
  const gatewayUrl = await gateway()

  // 重新连接的逻辑
  const reconnect = async () => {
    if (reconnectAttempts >= 5) {
      console.info(
        'The maximum number of reconnections has been reached, cancel reconnection'
      )
      return
    }

    console.info('reconnecting...')
    // 延迟一段时间后发起重新连接
    await new Promise(resolve => setTimeout(resolve, 5000))

    // 调用createClient函数重新建立连接
    await createClient(conversation, shard)

    reconnectAttempts++ // 递增重连计数器
  }

  if (gatewayUrl) {
    const ws = new WebSocket(gatewayUrl)
    ws.on('open', () => {
      console.info('TOKEN ok')
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

    const map = {
      0: ({ t, d }) => {
        // 存在,则执行t对应的函数
        conversation(t, d)
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
          console.info('restore connection')
          // 重制次数
          reconnectAttempts = 0
        }
      },
      6: message => {
        console.info('connection attempt', message)
      },
      7: async message => {
        // 执行重新连接
        console.info('reconnect', message)
        // 取消鉴权发送
        if (power) clearInterval(power)
        await reconnect()
      },
      9: message => {
        console.info('parameter error', message)
      },
      10: ({ d }) => {
        // 重制次数
        isConnected = true
        //
        heartbeat_interval = d.heartbeat_interval
        const { token, intents } = getBotConfig()
        /**
         * 发送鉴权
         */
        ws.send(
          JSON.stringify({
            op: 2, // op = 2
            d: {
              token: `QQBot ${token}`,
              intents: intents,
              shard,
              properties: {
                $os: process.platform,
                $browser: 'alemonjs',
                $device: 'alemonjs'
              }
            }
          })
        )
        reconnectAttempts = 0
      },
      11: () => {
        // OpCode 11 Heartbeat ACK 消息，心跳发送成功
        console.info('heartbeat transmission')
      },
      12: message => {
        console.info('platform data', message)
      }
    }

    /**
     * 监听消息
     */
    ws.on('message', async msg => {
      const message = JSON.parse(msg.toString('utf8'))
      const { op, s, d, t } = message
      // 根据 opcode 进行处理
      if (Object.prototype.hasOwnProperty.call(map, op)) {
        map[op]({ d, t })
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
