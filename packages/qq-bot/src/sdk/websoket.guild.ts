import WebSocket from 'ws'
import { config } from './config.js'
import { getIntentsMask } from './intents.js'
import { QQBotAPI } from './api.js'
import { QQBotGuildEventMap } from './message.guild.js'
import { Counter } from './counter.js'
import { GuildOptions } from './websoket.guild.types.js'

/**
 * 连接
 */
export class QQBotGuildClient extends QQBotAPI {
  //
  #counter = new Counter(1) // 初始值为1

  // 标记是否已连接
  #isConnected = false

  // 存储最新的消息序号
  #heartbeat_interval = 30000

  // 鉴权
  #IntervalId = null

  // url
  #gatewayUrl = null

  #ws: WebSocket

  /**
   *
   * @param opstion
   */
  constructor(opstion: GuildOptions) {
    super()
    for (const key in opstion) {
      config.set(key, opstion[key])
    }
  }

  /**
   * 鉴权数据
   * @returns
   */
  #aut() {
    const app_id = config.get('app_id')
    const token = config.get('token')
    const intents = config.get('intents')
    const shard = config.get('shard')
    return {
      op: 2, // op = 2
      d: {
        token: `Bot ${app_id}.${token}`,
        intents: getIntentsMask(intents),
        shard,
        properties: {
          $os: process.platform,
          $browser: 'alemonjs',
          $device: 'alemonjs'
        }
      }
    }
  }

  #events: {
    [K in keyof QQBotGuildEventMap]?: ((event: QQBotGuildEventMap[K]) => any)[]
  } = {}

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof QQBotGuildEventMap>(key: T, val: (event: QQBotGuildEventMap[T]) => any) {
    if (!this.#events[key]) this.#events[key] = []
    this.#events[key].push(val)
    return this
  }

  /**
   *
   * @param cfg
   */
  async connect() {
    //
    this.#gatewayUrl = await this.gateway()
      .then(res => res.url)
      .catch(err => {
        if (this.#events['ERROR']) {
          for (const item of this.#events['ERROR']) {
            item(err)
          }
        }
      })

    // 请求url
    if (!this.#gatewayUrl) return this

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
        this.#counter.getNextId()
      }, 5000)
    }

    const start = () => {
      if (this.#gatewayUrl) {
        const map = {
          0: async ({ t, d }) => {
            // 执行
            if (this.#events[t]) {
              try {
                for (const event of this.#events[t]) {
                  // 是否是函数
                  if (typeof event != 'function') continue
                  event(d)
                }
              } catch (err) {
                if (this.#events['ERROR']) {
                  for (const item of this.#events['ERROR']) {
                    item(err)
                  }
                }
              }
            }
            // Ready Event，鉴权成功
            if (t === 'READY') {
              this.#IntervalId = setInterval(() => {
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
            if (this.#IntervalId) clearInterval(this.#IntervalId)
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
          if (process.env.QQ_WS == 'dev') console.info('message', message)
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

    return this
  }
}
