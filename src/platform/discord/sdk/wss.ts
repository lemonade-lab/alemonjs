import WebSocket from 'ws'
import { ClientDISOCRD } from './api.js'
import { config } from './config.js'
import { getIntents } from './intents.js'
import { Email } from '../../../email/email.js'
import { loger } from '../../../log.js'
import { DISOCRDOptions } from './wss.types.js'

export class Client {
  //
  Email = new Email()
  #heartbeat_interval = 0

  #session_id = ''

  #resume_gateway_url = ''

  #ws: WebSocket

  /**
   * 设置配置
   * @param opstion
   */
  set(opstion: DISOCRDOptions) {
    config.set('intent', getIntents(opstion.intent))
    config.set('shard', opstion.shard)
    config.set('token', opstion.token)
    return this
  }

  /**
   *
   * @returns
   */
  #aut() {
    const token = config.get('token')
    const intent = config.get('intent')
    const shard = config.get('shard')
    return {
      op: 2,
      d: {
        shard: shard,
        token: `Bot ${token}`,
        intents: intent,
        properties: {
          os: process.platform,
          browser: 'alemonjs',
          device: 'alemonjs'
        }
      }
    }
  }

  /**
   *
   */
  #reAut() {
    const token = config.get('token')
    return {
      op: 6,
      d: {
        token: token,
        session_id: this.#session_id,
        seq: 1337
      }
    }
  }

  /**
   * 创建ws监听
   * @param conversation
   * @param shard
   * @returns
   */
  async connect(conversation: (...args: any[]) => any) {
    const url = await ClientDISOCRD.gateway().then(res => res?.url)
    if (!url) return

    const call = async () => {
      this.#ws.send(
        JSON.stringify({
          op: 1, //  op = 1
          d: null // 如果是第一次连接，传null
        })
      )
      setTimeout(call, this.#heartbeat_interval)
    }

    const map = {
      0: ({ d, t }) => {
        conversation(t, d)
        if (t == 'READY') {
          this.#session_id = d?.session_id
          if (d?.resume_gateway_url) {
            this.#resume_gateway_url = d?.resume_gateway_url
          }
        }
      },
      7: () => {
        loger.info('[ws] 重新请求')
        this.#ws.send(JSON.stringify(this.#reAut()))
      },
      9: message => {
        //  6 或 2 失败
        // 连接失败
        loger.info('[ws] parameter error', message)
      },
      /**
       * 打招呼
       * @param param0
       */
      10: ({ d }) => {
        const { heartbeat_interval: ih } = d
        this.#heartbeat_interval = ih
        //
        this.#ws.send(
          JSON.stringify({
            op: 1,
            d: null
          })
        )
        setTimeout(call, this.#heartbeat_interval)
        // 在初次握手期间启动新会话
        this.#ws.send(JSON.stringify(this.#aut()))
      },
      11: ({ d }) => {
        loger.info('[ws] heartbeat transmission')
      }
    }

    this.#ws = new WebSocket(`${url}?v=10&encoding=json`)

    this.#ws.on('open', async () => {
      loger.info('[ws] open')
    })

    // 消息
    this.#ws.on('message', data => {
      const message = JSON.parse(data.toString())
      if (process.env?.DISCORD_WS == 'dev') loger.info('message', message)
      if (map[message.op]) map[message.op](message)
    })

    // 关闭
    this.#ws.on('close', err => {
      loger.error('[ws] 登录失败,TOKEN存在风险')

      if (process.env?.NODE_ENV == 'production') {
        this.Email.send({
          subject: 'AlemonJS-BOT',
          text: 'DISCORD-WS-close'
        })
      }
    })

    // 出错
    this.#ws.on('error', error => {
      loger.error('[ws] error:', error)
    })
  }
}
