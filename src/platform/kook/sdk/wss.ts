import WebSocket from 'ws'
import axios from 'axios'
import { config } from './config.js'
import { EventData, SystemData } from './typings.js'
import { Email } from '../../../email/email.js'
import { loger } from '../../../log.js'

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
  //
  Email = new Email()
  // 标记是否已连接
  #isConnected = false

  // 存储 session ID
  #sessionID = null

  // 存储最新的消息序号
  #lastMessageSN = 0

  /**
   * 获取鉴权
   * @param token  token
   * @param url 请求地址
   * @param compress 下发数据是否压缩，默认为1，代表压缩
   * @returns
   */
  async #getGatewayUrl(): Promise<string | undefined> {
    // 替换为实际的接口地址
    const token = config.get('token')
    try {
      const response = await axios
        .get('https://www.kookapp.cn/api/v3/gateway/index', {
          params: {
            compress: 0
          },
          headers: {
            Authorization: `Bot ${token}`
          }
        })
        .then(res => res.data)
      if (response.code === 0) {
        return response.data.url
      } else {
        loger.error('[getway] http err', response.message)
      }
    } catch (error) {
      loger.error('[getway] token err', error.message)
    }
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

  /**
   * 使用获取到的网关连接地址建立 WebSocket 连接
   * @param token
   * @param conversation
   */
  async connect(conversation: (...args: any[]) => any) {
    // 请求url
    const gatewayUrl = await this.#getGatewayUrl()

    if (!gatewayUrl) return

    // 建立连接

    const map = {
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
      1: ({ d }) => {
        if (d && d.code === 0) {
          loger.info('[ws] ok')
          this.#sessionID = d.session_id
          this.#isConnected = true
        } else {
          loger.info('[ws] err')
        }
      },
      2: message => {
        loger.info('[ws] ping')
        this.#ws.send(
          JSON.stringify({
            s: 3
          })
        )
      },
      3: message => {
        loger.info('[ws] pong')
      },
      4: message => {
        loger.info('[ws] resume')
      },
      5: message => {
        loger.info('[ws] Connection failed, reconnect')
        /**
         * 处理 RECONNECT 信令
         * 断开当前连接并进行重新连接
         */
        this.#isConnected = false
        this.#sessionID = null
      },
      6: message => {
        loger.info('[ws] resume ack')
      }
    }

    this.#ws = new WebSocket(gatewayUrl)

    this.#ws.on('open', () => {
      loger.info('[ws] open')
    })

    this.#ws.on('message', async msg => {
      const message = JSON.parse(msg.toString('utf8'))
      if (process.env.KOOK_WS == 'dev') loger.info('message', message)
      if (map[message.s]) map[message.s](message)
    })

    // 心跳定时发送
    setInterval(() => {
      if (this.#isConnected) {
        this.#ws.send(
          JSON.stringify({
            s: 2,
            sn: this.#lastMessageSN
          })
        )
      }
    }, 30000)

    this.#ws.on('close', () => {
      loger.error('[ws] close')
      if (process.env?.NODE_ENV == 'production') {
        this.Email.send({
          subject: 'AlemonJS-BOT',
          text: 'KOOK-WS-close'
        })
      }
    })

    this.#ws.on('error', err => {
      loger.error('[ws] error', err)
    })
  }
}
