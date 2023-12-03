import WebSocket from 'ws'
import { gateway, getAuthentication } from './api/index.js'
import { getBotConfig, setBotConfig } from './config.js'
import { type BotCaCheType } from './config.js'
import { Counter } from './counter.js'

const counter = new Counter(1) // 初始值为1

/**
 * 定时鉴权
 * @param cfg
 * @returns
 */
async function setTimeoutBotConfig() {
  const callBack = async () => {
    const appID = getBotConfig('appID')
    const secret = getBotConfig('secret')
    // 发送请求
    const data: {
      access_token: string
      expires_in: number
      cache: boolean
    } = await getAuthentication(appID, secret).then(res => res.data)
    setBotConfig('token', data.access_token)
    console.info('refresh', data.expires_in, 's')
    setTimeout(callBack, data.expires_in * 1000)
  }
  await callBack()
  return
}

/**
 *
 * @param cfg
 * @param conversation
 */
export async function createClient(
  cfg: BotCaCheType,
  conversation: (...args: any[]) => any
) {
  setBotConfig('appID', cfg.appID)
  setBotConfig('token', cfg.token)
  setBotConfig('intents', cfg.intents)
  setBotConfig('shard', cfg.shard)
  setBotConfig('isPrivate', cfg.isPrivate)
  setBotConfig('sandbox', cfg.sandbox)
  setBotConfig('secret', cfg.secret)

  /**
   * 定时模式
   */
  if (cfg.secret != '') await setTimeoutBotConfig()

  // 请求url
  const gatewayUrl = await gateway()

  // 重新连接的逻辑
  const reconnect = async () => {
    if (counter.getID() >= 5) {
      console.info(
        'The maximum number of reconnections has been reached, cancel reconnection'
      )
      return
    }
    setTimeout(() => {
      console.info('reconnecting...')
      // 重新starrt
      start()
      // 记录
      counter.getNextID()
    }, 5000)
  }

  const start = () => {
    if (gatewayUrl) {
      const ws = new WebSocket(gatewayUrl)
      ws.on('open', () => {
        console.info('[ws] open')
      })
      // 标记是否已连接
      let isConnected = false
      // 存储最新的消息序号
      let heartbeat_interval = 30000
      // 鉴权
      let power
      const map = {
        0: async ({ t, d }) => {
          // 存在,则执行t对应的函数
          await conversation(t, d)
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
            counter.setID(0)
          }
          return
        },
        6: ({ d }) => {
          console.info('connection attempt', d)
          return
        },
        7: async ({ d }) => {
          // 执行重新连接
          console.info('reconnect', d)
          // 取消鉴权发送
          if (power) clearInterval(power)
          return
        },
        9: ({ d, t }) => {
          console.info('parameter error', d)
          return
        },
        10: ({ d }) => {
          // 重制次数
          isConnected = true
          // 记录新循环
          heartbeat_interval = d.heartbeat_interval
          const token = getBotConfig('token')
          const intents = getBotConfig('intents')
          const shard = getBotConfig('shard')
          // 发送鉴权
          ws.send(
            JSON.stringify({
              op: 2, // op = 2
              d: {
                token: `QQBot ${token}`,
                intents: intents,
                shard: shard,
                properties: {
                  $os: process.platform,
                  $browser: 'alemonjs',
                  $device: 'alemonjs'
                }
              }
            })
          )
          return
        },
        11: () => {
          // OpCode 11 Heartbeat ACK 消息，心跳发送成功
          console.info('heartbeat transmission')
          // 重制次数
          counter.setID(0)
          return
        },
        12: ({ d }) => {
          console.info('platform data', d)
          return
        }
      }
      // 监听消息
      ws.on('message', async msg => {
        const message = JSON.parse(msg.toString('utf8'))
        const { op, s, d, t } = message
        if (process.env.NTQQ_WS == 'dev') {
          console.log('data', d)
        }
        // 根据 opcode 进行处理
        if (Object.prototype.hasOwnProperty.call(map, op)) {
          await map[op]({ d, t })
        }
      })
      ws.on('close', async err => {
        await reconnect()
        console.info('[ws] close', err)
      })
    }
  }

  start()
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
