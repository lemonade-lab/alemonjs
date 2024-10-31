import WebSocket from 'ws'
import { QQBotGroupAPI } from './api.js'
import { config } from './config.js'
import { Counter } from '../../../core/utils.js'
import { getIntentsMask } from './intents.js'
import { NTQQOptions } from './wss.types.js'
import { QQBotGroupEventMap } from './message.js'

/**
 * 连接
 */
export class QQBotGroupClient extends QQBotGroupAPI {
  //
  #counter = new Counter(1) // 初始值为1

  // 标记是否已连接
  #isConnected = false

  // 存储最新的消息序号
  #heartbeat_interval = 30000

  // 鉴权
  #IntervalID = null

  // url
  #gatewayUrl = null

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: NTQQOptions) {
    super()
    config.set('appID', opstion.appID)
    config.set('token', opstion.token)
    config.set('intents', opstion.intents)
    config.set('shard', opstion.shard)
    config.set('isPrivate', opstion.isPrivate)
    config.set('sandbox', opstion.sandbox)
    config.set('secret', opstion.secret)
  }

  /**
   * 定时鉴权
   * @param cfg
   * @returns
   */
  async #setTimeoutBotConfig() {
    const callBack = async () => {
      const appID = config.get('appID')
      const secret = config.get('secret')
      // 发送请求
      const data: {
        access_token: string
        expires_in: number
        cache: boolean
      } = await this.getAuthentication(appID, secret).then(res => res.data)
      config.set('token', data.access_token)
      console.info('refresh', data.expires_in, 's')
      setTimeout(callBack, data.expires_in * 1000)
    }
    await callBack()
    return
  }

  /**
   * 鉴权数据
   * @returns
   */
  #aut() {
    const token = config.get('token')
    const intents = config.get('intents')
    const shard = config.get('shard')
    return {
      op: 2, // op = 2
      d: {
        token: `QQBot ${token}`,
        intents: getIntentsMask(intents),
        shard: shard,
        properties: {
          $os: process.platform,
          $browser: 'alemonjs',
          $device: 'alemonjs'
        }
      }
    }
  }

  #ws: WebSocket

  #events: {
    [K in keyof QQBotGroupEventMap]?: (event: QQBotGroupEventMap[K]) => any
  } = {}

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof QQBotGroupEventMap>(key: T, val: (event: QQBotGroupEventMap[T]) => any) {
    this.#events[key] = val
    return this
  }

  /**
   *
   * @param cfg
   * @param conversation
   */
  async connect() {
    // 定时模式
    await this.#setTimeoutBotConfig()

    // 请求url
    if (!this.#gatewayUrl) {
      this.#gatewayUrl = await this.gateway().then(res => res?.url)
    }
    if (!this.#gatewayUrl) return

    // 重新连接的逻辑
    const reconnect = async () => {
      if (this.#counter.get() >= 5) {
        console.info('The maximum number of reconnections has been reached, cancel reconnection')
        return
      }
      setTimeout(() => {
        console.info('[ws] reconnecting...')
        // 重新starrt
        start()
        // 记录
        this.#counter.getNextID()
      }, 5000)
    }

    const start = () => {
      if (this.#gatewayUrl) {
        const map = {
          0: async ({ t, d }) => {
            if (this.#events[t]) {
              try {
                await this.#events[t](d)
              } catch (err) {
                if (this.#events['ERROR']) this.#events['ERROR'](err)
              }
            }

            // Ready Event，鉴权成功
            if (t === 'READY') {
              this.#IntervalID = setInterval(() => {
                if (this.#isConnected) {
                  this.#ws.send(
                    JSON.stringify({
                      op: 1, //  op = 1
                      d: null // 如果是第一次连接，传null
                    })
                  )
                }
              }, this.#heartbeat_interval)
            }
            // Resumed Event，恢复连接成功
            if (t === 'RESUMED') {
              console.info('[ws] restore connection')
              // 重制次数
              this.#counter.reStart()
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
            if (this.#IntervalID) clearInterval(this.#IntervalID)
            return
          },
          9: ({ d }) => {
            console.info('[ws] parameter error', d)
            return
          },
          10: ({ d }) => {
            // 重制次数
            this.#isConnected = true
            // 记录新循环
            this.#heartbeat_interval = d.heartbeat_interval
            // 发送鉴权
            this.#ws.send(JSON.stringify(this.#aut()))
            return
          },
          11: () => {
            // OpCode 11 Heartbeat ACK 消息，心跳发送成功
            console.info('[ws] heartbeat transmission')
            // 重制次数
            this.#counter.reStart()
            return
          },
          12: ({ d }) => {
            console.info('[ws] platform data', d)
            return
          }
        }
        // 连接
        this.#ws = new WebSocket(this.#gatewayUrl)
        this.#ws.on('open', () => {
          console.info('[ws] open')
        })
        // 监听消息
        this.#ws.on('message', async msg => {
          const message = JSON.parse(msg.toString('utf8'))
          if (process.env.NTQQ_WS == 'dev') console.info('message', message)
          // 根据 opcode 进行处理
          if (map[message.op]) {
            map[message.op](message)
          }
        })
        // 关闭
        this.#ws.on('close', async err => {
          await reconnect()
          console.info('[ws] close', err)
        })
      }
    }
    start()
  }
}
