import WebSocket from 'ws'
import { DCAPI } from './api.js'
import { config } from './config.js'
import { getIntents } from './intents.js'
import { DISOCRDOptions } from './wss.types.js'
import { DCEventMap } from './message.js'

export class DCClient extends DCAPI {
  #heartbeat_interval = 0

  #session_id = ''

  #gateway_url = ''

  #ws: WebSocket

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: DISOCRDOptions) {
    super()
    config.set('intent', opstion.intent)
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
        intents: getIntents(intent),
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

  #events: {
    [K in keyof DCEventMap]?: (event: DCEventMap[K]) => any
  } = {}

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof DCEventMap>(key: T, val: (event: DCEventMap[T]) => any) {
    this.#events[key] = val
    return this
  }

  /**
   * 创建ws监听
   * @param conversation
   * @param shard
   * @returns
   */
  async connect() {
    const url = await this.gateway()
      .then(res => res?.url)
      .catch(err => {
        if (this.#events['ERROR']) this.#events['ERROR'](err)
      })
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
      0: async ({ d, t }) => {
        if (this.#events[t]) {
          try {
            await this.#events[t](d)
          } catch (err) {
            if (this.#events['ERROR']) this.#events['ERROR'](err)
          }
        }
        if (t == 'READY') {
          this.#session_id = d?.session_id
          if (d?.resume_gateway_url) {
            this.#gateway_url = d?.gateway_url
            console.log('[ws] ', this.#gateway_url)
          }
        }
      },
      7: () => {
        console.info('[ws] 重新请求')
        this.#ws.send(JSON.stringify(this.#reAut()))
      },
      9: message => {
        //  6 或 2 失败
        // 连接失败
        console.info('[ws] parameter error', message)
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
      11: () => {
        console.info('[ws] heartbeat transmission')
      }
    }

    this.#ws = new WebSocket(`${url}?v=10&encoding=json`)

    this.#ws.on('open', async () => {
      console.info('[ws] open')
    })

    // 消息
    this.#ws.on('message', data => {
      const message = JSON.parse(data.toString())
      if (process.env?.DISCORD_WS == 'dev') console.info('message', message)
      if (map[message.op]) map[message.op](message)
    })

    // 关闭
    this.#ws.on('close', err => {
      console.error('[ws] 登录失败,TOKEN存在风险', err)
    })

    // 出错
    this.#ws.on('error', err => {
      console.error('[ws] error:', err)
    })
  }
}
