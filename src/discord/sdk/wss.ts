import WebSocket from 'ws'
import { ClientDISOCRD } from './api.js'
import { config } from './config.js'
import { IntentsEnum } from './types.js'
import { getIntents } from './intents.js'

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
  /**
   * 设置配置
   * @param opstion
   */
  set(opstion: DISOCRDOptions) {
    config.set('intent', getIntents(opstion.intent))
    config.set('shard', opstion.shard)
    config.set('token', opstion.token)
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

  #heartbeat_interval = 0

  #session_id = ''

  #resume_gateway_url = ''

  #ws: WebSocket

  /**
   * 创建ws监听
   * @param conversation
   * @param shard
   * @returns
   */
  async connect(conversation: (...args: any[]) => any) {
    const { url } = await ClientDISOCRD.gateway()
    if (!url) {
      console.error('[getway] token err')
      return
    }

    const call = async () => {
      this.#ws.send(
        JSON.stringify({
          op: 1, //  op = 1
          d: null // 如果是第一次连接，传null
        })
      )
      setTimeout(call, this.#heartbeat_interval)
    }

    //
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
      11: ({ d }) => {
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
      console.error('[ws] 登录失败,TOKEN存在风险')
    })

    // 出错
    this.#ws.on('error', error => {
      console.error('[ws] error:', error)
    })
  }
}
