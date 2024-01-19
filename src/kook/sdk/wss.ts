import WebSocket from 'ws'
import axios from 'axios'
import { config } from './config.js'
import { EventData, SystemData } from './typings.js'
import { ReStart } from '../../core/index.js'
import { Email } from '../../email/email.js'

/**
 * ****
 * ***
 */
export interface KOOKOptions {
  /**
   * 钥匙
   */
  token: string
  /**
   * 主人编号
   */
  masterID?: string | string[]
}

/**
 *
 */
export const defineKOOK: KOOKOptions = {
  token: '',
  masterID: ''
}

export class Client {
  // 标记是否已连接
  #isConnected = false

  // 存储 session ID
  #sessionID = null

  // 存储最新的消息序号
  #lastMessageSN = 0

  Email = new Email()

  /**
   * 获取鉴权
   * @param token  token
   * @param url 请求地址
   * @param compress 下发数据是否压缩，默认为1，代表压缩
   * @returns
   */
  async #getGatewayUrl(): Promise<
    | {
        data: {
          code: number
          url: string
        }
      }
    | undefined
  > {
    // 替换为实际的接口地址
    const token = config.get('token')
    return await axios
      .get('https://www.kookapp.cn/api/v3/gateway/index', {
        params: {
          compress: 0
        },
        headers: {
          Authorization: `Bot ${token}`
        }
      })
      .then(res => res.data)
  }

  /**
   * 设置配置
   * @param opstion
   */
  set(opstion: KOOKOptions) {
    config.set('token', opstion.token)
    return this
  }

  #ws: WebSocket

  #url = null

  /**
   * 使用获取到的网关连接地址建立 WebSocket 连接
   * @param token
   * @param conversation
   */
  async connect(conversation: (...args: any[]) => any) {
    // 请求url
    this.#url = await this.#getGatewayUrl().then(res => res?.data?.url)

    if (!this.#url) return

    // 建立连接

    const map = {
      // 处理
      0: async ({ d, sn }) => {
        /**
         * 处理 EVENT 信令
         * 包括按序处理消息和记录最新的消息序号
         */
        if (d && sn) {
          if (sn === this.#lastMessageSN + 1) {
            /**
             * 消息序号正确
             * 按序处理消息
             */
            this.#lastMessageSN = sn
            /**
             * 处理消息并传递给almeon
             */
            const event: EventData | SystemData = d
            //
            await conversation(event)
          } else if (sn > this.#lastMessageSN + 1) {
            /**
             * 消息序号乱序
             * 存入暂存区等待正确的序号处理
             * 存入暂存区
             */
          }
          /**
           * 如果收到已处理过的消息序号
           * 则直接丢弃
           */
        }
      },
      // 反馈
      1: ({ d }) => {
        if (d && d.code === 0) {
          console.info('[ws] ok')
          this.#sessionID = d.session_id
          this.#isConnected = true

          this.#at.del()
        } else {
          console.info('[ws] err')
        }
      },
      // 心跳
      2: message => {
        console.info('[ws] ping')
        if (this.#ws.readyState == 1) {
          this.#ws.send(
            JSON.stringify({
              s: 3
            })
          )
        }
      },
      // 连接失败
      3: message => {
        console.info('[ws] pong')
        // 尝试重启

        if (this.#ws.readyState == 1) this.#ws.close()
      },
      // 重新连接
      4: message => {
        console.info('[ws] resume')
        // 尝试重启

        if (this.#ws.readyState == 1) this.#ws.close()
      },
      // 断开了
      5: message => {
        console.info('[ws] Connection failed, reconnect')
        /**
         * 处理 RECONNECT 信令
         * 断开当前连接并进行重新连接
         */
        this.#isConnected = false
        this.#sessionID = null

        // 尝试重启

        if (this.#ws.readyState == 1) this.#ws.close()
      },
      // 成功
      6: message => {
        console.info('[ws] resume ack')
      }
    }

    // 连接
    this.#start(map)
  }

  #intervalID = null

  #at = new ReStart(3)

  #start(map) {
    this.#ws = new WebSocket(this.#url)

    this.#ws.on('open', () => {
      console.info('[ws] open')
    })

    this.#ws.on('message', async msg => {
      const message = JSON.parse(msg.toString('utf8'))
      if (process.env.KOOK_WS == 'dev') console.info('message', message)
      if (map[message.s]) map[message.s](message)
    })

    // 心跳定时发送
    this.#intervalID = setInterval(() => {
      // 定时发送心跳?
      if (this.#isConnected) {
        if (this.#ws.readyState == 1) {
          this.#ws.send(
            JSON.stringify({
              s: 2,
              sn: this.#lastMessageSN
            })
          )
        }
      }
    }, 30000)

    this.#ws.on('close', () => {
      console.error('[ws] close')
      // 尝试重启
      this.#timeout(map)
    })

    this.#ws.on('error', err => {
      console.error('[ws] error', err)

      if (process.env?.NODE_ENV == 'production') {
        this.Email.send({
          subject: 'AlemonJS-BOT',
          text: 'KOOK-WS-close'
        })
      }

      // 尝试重启
      this.#timeout(map)
    })
  }

  #timeoutID = null

  /**
   * 定时重启
   * @returns
   */
  #timeout(map) {
    // 确保之前的被删除
    clearTimeout(this.#timeoutID)
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
