import WebSocket from 'ws'
import { ClientDISOCRD } from './api.js'
import { config } from './config.js'
import { IntentsEnum } from './types.js'
import { getIntents } from './intents.js'
import { ReStart } from '../../core/index.js'

/**
 * ****
 * discord
 * ***
 */
export interface DISOCRDOptions {
  /**
   * 钥匙
   */
  token: string
  /**
   * 订阅
   */
  intent?: IntentsEnum[]
  /**
   * 分片
   */
  shard?: number[]
  /**
   * 主人编号
   */
  masterID?: string | string[]
}
/**
 *
 */
export const defineDISCORD: DISOCRDOptions = {
  token: '',
  intent: [
    IntentsEnum.MESSAGE_CONTENT, // 内容是基础
    //
    IntentsEnum.DIRECT_MESSAGES,
    IntentsEnum.DIRECT_MESSAGE_TYPING,
    IntentsEnum.DIRECT_MESSAGE_REACTIONS,
    //
    IntentsEnum.GUILDS,
    IntentsEnum.GUILD_MESSAGE_TYPING,
    IntentsEnum.REACTIONS,
    IntentsEnum.GUILD_MESSAGES,
    IntentsEnum.MEMBERS,
    //
    IntentsEnum.GUILD_MODERATION,
    IntentsEnum.GUILD_EMOJIS_AND_STICKERS,
    IntentsEnum.GUILD_INTEGRATIONS,
    IntentsEnum.GUILD_WEBHOOKS,
    IntentsEnum.GUILD_INVITES,
    IntentsEnum.GUILD_VOICE_STATES,
    IntentsEnum.GUILD_PRESENCES
  ],
  shard: [0, 1],
  masterID: ''
}

export class Client {
  #heartbeat_interval = 0

  #session_id = ''

  #resume_gateway_url = ''

  #ws: WebSocket

  #at = new ReStart(3)

  #timeoutID = null

  #url = null

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
   * 得到鉴权
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
   * 重新鉴权
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
   * 发送机心跳
   */
  #call() {
    this.#ws.send(
      JSON.stringify({
        op: 1, //  op = 1
        d: null // 如果是第一次连接，传null
      })
    )
    this.#timeoutID = setTimeout(this.#call, this.#heartbeat_interval)
  }

  /**
   * 创建ws监听
   * @param conversation
   * @param shard
   * @returns
   */
  async connect(conversation: (...args: any[]) => any) {
    this.#url = await ClientDISOCRD.gateway().then(res => res?.url)

    if (!this.#url) {
      console.error('[getway] token err')
      return
    }

    // 定义处理map
    const map = {
      // 数据处理
      0: ({ d, t }) => {
        conversation(t, d)
        if (t == 'READY') {
          // 连接成功
          this.#at.del()

          this.#session_id = d?.session_id
          if (d?.resume_gateway_url) {
            this.#resume_gateway_url = d?.resume_gateway_url
          }
        }
      },
      7: () => {
        console.info('[ws] 重新请求')
        this.#ws.send(JSON.stringify(this.#reAut()))
      },
      9: message => {
        //  6 | 2 err
        console.info('[ws] parameter error', message)
        // 尝试重启
        this.#timeout(map)
      },
      /**
       * 打招呼
       * @param param0
       */
      10: ({ d }) => {
        this.#heartbeat_interval = d.heartbeat_interval
        // 回传
        this.#ws.send(
          JSON.stringify({
            op: 1,
            d: null
          })
        )
        // 发送鉴权
        this.#ws.send(JSON.stringify(this.#aut()))
        // 一定时间后回复
        this.#timeoutID = setTimeout(this.#call, this.#heartbeat_interval)
      },
      //
      11: ({ d }) => {
        console.info('[ws] heartbeat transmission')
      }
    }
    // 开始连接
    this.#start(map)
  }

  /**
   * 开始连接
   * @param map
   */
  #start(map: any) {
    this.#ws = new WebSocket(`${this.#url}?v=10&encoding=json`)
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
      console.error('[ws] 登录失败,TOKEN存在风险')
      // 尝试重启
      this.#timeout(map)
    })

    // 出错
    this.#ws.on('error', error => {
      console.error('[ws] error:', error)
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
