import WebSocket from 'ws'
import { ClientNTQQ } from './api.js'
import { config } from './config.js'
import { Counter } from '../../core/index.js'
import { IntentsEnum, getIntentsMask } from './intents.js'
import { ReStart } from '../../core/index.js'
import { Email } from '../../email/email.js'

/**
 * *****
 * ntqq
 * ****
 */
export interface NTQQOptions {
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
  secret: string
  /**
   * 主人编号
   */
  masterID?: string | string[]
  /**
   * 事件订阅
   */
  intents?: IntentsEnum[]
  /***
   * 分片
   */
  shard?: number[]
  /**
   * 是否是私域
   */
  isPrivate?: boolean
  /**
   * 是否是沙盒环境
   */
  sandbox?: boolean
}

export const defineNtqq: NTQQOptions = {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  intents: ['GROUP_AT_MESSAGE_CREATE', 'C2C_MESSAGE_CREATE'] as IntentsEnum[],
  shard: [0, 1],
  isPrivate: false,
  sandbox: false
}

/**
 * 连接
 */
export class Client {
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

  //
  #at = new ReStart(3)

  Email = new Email()

  /**
   * 设置配置
   * @param opstion
   */
  set(opstion: NTQQOptions) {
    config.set('appID', opstion.appID)
    config.set('token', opstion.token)
    config.set('intents', getIntentsMask(opstion.intents))
    config.set('shard', opstion.shard)
    config.set('isPrivate', opstion.isPrivate)
    config.set('sandbox', opstion.sandbox)
    config.set('secret', opstion.secret)
    return this
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
      } = await ClientNTQQ.getAuthentication(appID, secret).then(
        res => res.data
      )
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
        intents: intents,
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

  /**
   *
   * @param cfg
   * @param conversation
   */
  async connect(conversation: (...args: any[]) => any) {
    // 定时模式
    await this.#setTimeoutBotConfig()

    // 请求url
    if (!this.#gatewayUrl) {
      this.#gatewayUrl = await ClientNTQQ.gateway().then(data => data?.url)
    }

    //
    if (!this.#gatewayUrl) return

    const map = {
      0: async ({ t, d }) => {
        // 存在,则执行t对应的函数
        await conversation(t, d)
        // Ready Event，鉴权成功
        if (t === 'READY') {
          // 连接成功
          this.#at.del()

          clearTimeout(this.#IntervalID)

          this.#IntervalID = setInterval(() => {
            if (this.#isConnected) {
              if (this.#ws.readyState == 1) {
                this.#ws.send(
                  JSON.stringify({
                    op: 1, //  op = 1
                    d: null // 如果是第一次连接，传null
                  })
                )
              }
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

        // 尝试重启

        if (this.#ws.readyState == 1) this.#ws.close()
        return
      },
      10: ({ d }) => {
        // 重制次数
        this.#isConnected = true
        // 记录新循环
        this.#heartbeat_interval = d.heartbeat_interval
        // 发送鉴权
        if (this.#ws.readyState == 1) {
          this.#ws.send(JSON.stringify(this.#aut()))
        }
        return
      },
      11: () => {
        // OpCode 11 Heartbeat ACK 消息，心跳发送成功
        console.info('[ws] heartbeat transmission')

        // 重制次数
        this.#counter.reStart()

        // 尝试重启

        if (this.#ws.readyState == 1) this.#ws.close()

        return
      },
      12: ({ d }) => {
        console.info('[ws] platform data', d)
        return
      }
    }

    this.#start(map)
  }

  /**
   *
   * @param map
   */
  #start(map) {
    // 连接
    this.#ws = new WebSocket(this.#gatewayUrl)
    //
    this.#ws.on('open', () => {
      console.info('[ws] open')
    })
    // 监听消息
    this.#ws.on('message', async msg => {
      const message = JSON.parse(msg.toString('utf8'))
      if (process.env.NTQQ_WS == 'dev') console.info('message', message)
      // 根据 opcode 进行处理
      if (map[message.op]) await map[message.op](message)
    })
    // 关闭
    this.#ws.on('close', async err => {
      console.info('[ws] close', err)

      if (process.env?.NODE_ENV == 'production') {
        this.Email.send({
          subject: 'AlemonJS-BOT',
          text: 'NTQQ-WS-close'
        })
      }

      // 尝试重启
      this.#timeout(map)
    })
  }

  /**
   * 定时重启
   * @returns
   */
  #timeout(map: any) {
    // 确保之前的被删除
    clearTimeout(this.#IntervalID)
    const size = this.#at.getSize()
    if (size >= 6) return
    // 一定时间后开始重新连接
    if (size === 1) {
      // 第一次
      setTimeout(() => {
        this.#start(map)
      }, this.#at.get())
    } else {
      // 累加
      setTimeout(() => {
        this.#start(map)
      }, this.#at.next())
    }
  }
}
