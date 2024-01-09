import WebSocket from 'ws'
import { ClientNTQQ } from './api.js'
import { config } from './config.js'
import { type ClientConfig } from './config.js'
import { Counter } from './counter.js'

const counter = new Counter(1) // 初始值为1

/**
 * 定时鉴权
 * @param cfg
 * @returns
 */
async function setTimeoutBotConfig() {
  const callBack = async () => {
    const appID = config.get('appID')
    const secret = config.get('secret')
    // 发送请求
    const data: {
      access_token: string
      expires_in: number
      cache: boolean
    } = await ClientNTQQ.getAuthentication(appID, secret).then(res => res.data)
    config.set('token', data.access_token)
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
  cfg: ClientConfig,
  conversation: (...args: any[]) => any
) {
  config.set('appID', cfg.appID)
  config.set('token', cfg.token)
  config.set('intents', cfg.intents)
  config.set('shard', cfg.shard)
  config.set('isPrivate', cfg.isPrivate)
  config.set('sandbox', cfg.sandbox)
  config.set('secret', cfg.secret)

  /**
   * 定时模式
   */
  if (cfg.secret != '') await setTimeoutBotConfig()

  // 请求url
  const gatewayUrl = await ClientNTQQ.gateway()

  // 重新连接的逻辑
  const reconnect = async () => {
    if (counter.getID() >= 5) {
      console.info(
        'The maximum number of reconnections has been reached, cancel reconnection'
      )
      return
    }
    setTimeout(() => {
      console.info('[ws] reconnecting...')
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
            console.info('[ws] restore connection')
            // 重制次数
            counter.setID(0)
          }
          return
        },
        6: ({ d }) => {
          console.info('[ws] connection attempt', d)
          return
        },
        7: async ({ d }) => {
          // 执行重新连接
          console.info('[ws] reconnect', d)
          // 取消鉴权发送
          if (power) clearInterval(power)
          return
        },
        9: ({ d, t }) => {
          console.info('[ws] parameter error', d)
          return
        },
        10: ({ d }) => {
          // 重制次数
          isConnected = true
          // 记录新循环
          heartbeat_interval = d.heartbeat_interval
          const token = config.get('token')
          const intents = config.get('intents')
          const shard = config.get('shard')
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
          console.info('[ws] heartbeat transmission')
          // 重制次数
          counter.setID(0)
          return
        },
        12: ({ d }) => {
          console.info('[ws] platform data', d)
          return
        }
      }
      // 监听消息
      ws.on('message', async msg => {
        const message = JSON.parse(msg.toString('utf8'))
        const { op, s, d, t } = message
        if (process.env.NTQQ_WS == 'dev') {
          console.info('data', d)
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
