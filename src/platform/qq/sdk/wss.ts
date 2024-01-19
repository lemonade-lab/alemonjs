import WebSocket from 'ws'
import { ClientQQ } from './api.js'
import { config } from './config.js'
import { getIntentsMask } from './intents.js'
import { IntentsEnum } from './typings.js'
import { Counter } from '../../../core/index.js'
import { Email } from '../../../email/email.js'

/**
 * ******
 * qq
 * *****
 */
export interface QQOptions {
  /**
   * 应用编号
   */
  appID: string
  /**
   * 钥匙
   */
  token: string
  /**
   * 密钥
   */
  secret?: string
  /**
   * 分片
   */
  shard?: number[]
  /**
   * 主人编号
   */
  masterID?: string | string[]
  /**
   * 事件订阅
   */
  intents?: IntentsEnum[]
  /**
   * 是否是私域
   */
  isPrivate?: boolean
  /**
   * 是否是沙盒环境
   */
  sandbox?: boolean
}

/**
 * 默认值
 */
export const defineQQ: QQOptions = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  intents: [
    'GUILDS', //频道进出
    'MEMBERS', //成员资料
    'DIRECT_MESSAGE', //私信
    'PUBLIC_GUILD_MESSAGES', //公域事件
    'REACTIONS' // 表情表态
  ],
  isPrivate: false,
  sandbox: false,
  shard: [0, 1]
}

/**
 * 连接
 */
export class Client {
  //
  Email = new Email()
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
  set(opstion: QQOptions) {
    config.set('appID', opstion.appID)
    config.set('token', opstion.token)
    config.set('intents', opstion.intents)
    config.set('sandbox', opstion.sandbox)
    config.set('shard', opstion.shard)
    return this
  }

  /**
   * 鉴权数据
   * @returns
   */
  #aut() {
    const appID = config.get('appID')
    const token = config.get('token')
    const intents = config.get('intents')
    const shard = config.get('shard')
    return {
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
    }
  }

  #ws: WebSocket

  /**
   *
   * @param cfg
   * @param conversation
   */
  async connect(conversation: (...args: any[]) => any) {
    this.#gatewayUrl = await ClientQQ.geteway().then(res => res.url)

    // 请求url
    if (!this.#gatewayUrl) return

    // 重新连接的逻辑
    const reconnect = async () => {
      if (this.#counter.get() >= 5) {
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
        this.#counter.getNextID()
      }, 5000)
    }

    const start = () => {
      if (this.#gatewayUrl) {
        const map = {
          0: async ({ t, d }) => {
            // 存在,则执行t对应的函数
            await conversation(t, d)
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
          9: ({ d, t }) => {
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

          if (process.env?.NODE_ENV == 'production') {
            this.Email.send({
              subject: 'AlemonJS-BOT',
              text: 'QQ-WS-close'
            })
          }
        })
        // 监听消息
        this.#ws.on('message', async msg => {
          const message = JSON.parse(msg.toString('utf8'))
          if (process.env.QQ_WS == 'dev') console.info('message', message)
          // 根据 opcode 进行处理
          if (map[message.op]) await map[message.op](message)
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
