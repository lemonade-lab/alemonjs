import WebSocket from 'ws'
import { ClientQQ } from './api.js'
import { config } from './config.js'
import { getIntentsMask } from './intents.js'
/**
 * 建立 WebSocket 连接
 * @param callBack
 * @param shard
 */
export async function createClient(
  callBack: (...args: any[]) => any,
  shard = [0, 1]
) {
  const gatewayUrl = await ClientQQ.geteway().then(res => res.url)
  if (gatewayUrl) {
    const ws = new WebSocket(gatewayUrl)

    ws.on('open', () => {
      console.info('[ws] open')
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
     * opcode
     *
     * s 标识消息的唯一性
     *
     * t 代表事件类型
     *
     * d 代表事件内容
     */
    const map = {
      0: ({ d, t }) => {
        callBack(t, d)
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
      },
      7: message => {
        console.info(message)
      },
      9: message => {
        console.info(message)
      },
      10: ({ d }) => {
        // OpCode 10 Hello 消息，处理心跳周期
        isConnected = true
        heartbeat_interval = d.heartbeat_interval
        const appID = config.get('appID')
        const token = config.get('token')
        const intents = config.get('intents')
        /**
         * 发送鉴权
         */
        ws.send(
          JSON.stringify({
            op: 2, // op = 2
            d: {
              token: `Bot ${appID}.${token}`,
              intents: getIntentsMask(intents),
              shard,
              properties: {
                $os: process.platform,
                $browser: 'alemonjs',
                $device: 'alemonjs'
              }
            }
          })
        )
      },
      11: message => {
        console.info('[ws] heartbeat transmission')
      },
      12: message => {
        console.info(message)
      }
    }

    ws.on('message', msg => {
      const message = JSON.parse(msg.toString('utf8'))
      // 根据 opcode 进行处理
      if (map[message.op]) map[message.op](message)
    })

    ws.on('close', () => {
      console.error('[ws]  close')
    })
  }
}
