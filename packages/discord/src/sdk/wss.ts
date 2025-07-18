import WebSocket from 'ws'
import { DCAPI } from './api.js'
import { getIntents } from './intents.js'
import { DCEventMap } from './message.js'
import { getDiscordConfig } from '../config.js'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { AvailableIntentsEventsEnum } from './types.js'
export class DCClient extends DCAPI {
  #heartbeat_interval = 0

  #session_id = ''

  #gateway_url = ''

  #timeout_id = null

  #seq = null

  #ws: WebSocket

  constructor() {
    super()
    return this
  }

  /**
   * 连接确认
   * @returns
   */
  #aut() {
    const value = getDiscordConfig()
    const token = value.token
    const intent = value.intent || AvailableIntentsEventsEnum
    const shard = value.shard || [0, 1]
    return {
      op: 2,
      d: {
        shard: shard,
        // 验证token
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
    const value = getDiscordConfig()
    const gatewayURL = value.gatewayURL

    // 清除序列号
    this.#seq = null
    // 清除心跳
    clearTimeout(this.#timeout_id)
    // 获取网关
    const url =
      gatewayURL ??
      (await this.gateway()
        .then(res => res?.url)
        .catch(err => {
          if (this.#events['ERROR']) this.#events['ERROR'](err?.message ?? err)
        }))
    // 没有网关
    if (!url) {
      console.error('[ws] 无法获取网关')
      return
    }

    /**
     * 心跳恢复
     */
    const call = async () => {
      this.#ws.send(
        JSON.stringify({
          op: 1, //  op = 1
          d: this.#seq // 如果是第一次连接，传null
        })
      )
      // 确保清除
      clearTimeout(this.#timeout_id)
      // 开始心跳
      this.#timeout_id = setTimeout(call, this.#heartbeat_interval)
    }

    const map = {
      /**
       * 事件接收到
       * @param param0
       */
      0: async ({ d, t, s }) => {
        if (s) {
          // 序列号
          this.#seq = s
        }
        // 准备
        if (t == 'READY') {
          if (d?.resume_gateway_url) {
            this.#gateway_url = d?.resume_gateway_url
            console.log('[ws] gateway_url', this.#gateway_url)
          }
          if (d?.session_id) {
            this.#session_id = d?.session_id
            console.log('[ws] session_id', this.#session_id)
          }
        }
        // 事件处理
        if (this.#events[t]) {
          try {
            await this.#events[t](d)
          } catch (err) {
            if (this.#events['ERROR']) this.#events['ERROR'](err)
          }
        }

        //
      },
      /**
       * 重新连接
       */
      7: () => {
        console.info('[ws] 重新连接')
        // this.#ws.send(JSON.stringify(this.#reAut()))
      },
      /**
       * 无效会话
       * @param message
       */
      9: ({ d }) => {
        console.error('[ws] 无效会话 ', d)
      },
      /**
       * 你好
       * @param param0
       */
      10: ({ d }) => {
        // 得到心跳间隔
        this.#heartbeat_interval = d.heartbeat_interval

        // 开始心跳
        call()

        // 开启会话
        this.#ws.send(JSON.stringify(this.#aut()))
      },
      /**
       * 心跳确认
       */
      11: () => {
        console.info('[ws] 心跳确认')
      }
    }

    const ClientOptions = value.websocket_options || {}
    if (value.websocket_proxy) {
      ClientOptions.agent = new HttpsProxyAgent(value.websocket_proxy)
    }

    this.#ws = new WebSocket(`${url}?v=10&encoding=json`, ClientOptions)

    this.#ws.on('open', async () => {
      console.info('[ws] open')
    })

    // 消息
    this.#ws.on('message', data => {
      const message = JSON.parse(data.toString())
      if (map[message.op]) map[message.op](message)
    })

    // 关闭
    this.#ws.on('close', err => {
      console.error('[ws] 连接已关闭', err)
      console.log('[ws] 等待重连')
      this.connect()
    })

    // 出错
    this.#ws.on('error', err => {
      console.error('[ws] error:', err)
    })

    ///
  }
}
