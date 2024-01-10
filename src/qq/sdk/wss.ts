import WebSocket from 'ws'
import { ClientQQ } from './api.js'
import { config } from './config.js'
import { getIntentsMask } from './intents.js'
import { IntentsEnum } from './typings.js'

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
  masterID?: string
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
    'GUILD_MEMBERS', //成员资料
    'DIRECT_MESSAGE', //私信
    'PUBLIC_GUILD_MESSAGES', //公域事件
    'GUILD_MESSAGE_REACTIONS' // 表情表态
  ],
  isPrivate: false,
  sandbox: false,
  shard: [0, 1]
}

/**
 * 客户端
 */
export class Client {
  /**
   * 连接地址
   */
  #url = null
  /**
   * 标记是否已连接
   */
  #isConnected = false
  /**
   * 周期
   */
  #heartbeat_interval = 30000

  /**
   * 设置配置
   */
  set(qq: QQOptions) {
    config.set('appID', qq.appID)
    config.set('token', qq.token)
    config.set('intents', qq.intents)
    config.set('sandbox', qq.sandbox)
    config.set('shard', qq.shard)
  }

  /**
   * 得到鉴权配置
   * @returns
   */
  #art() {
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
   * opcode
   *
   * s 标识消息的唯一性
   *
   * t 代表事件类型
   *
   * d 代表事件内容
   */

  /**
   * 建立 WebSocket 连接
   * @param callBack
   * @param shard
   */
  async connect(callBack: (...args: any[]) => any) {
    this.#url = await ClientQQ.geteway().then(res => res.url)
    if (!this.#url) return

    const map = {
      0: ({ d, t }) => {
        callBack(t, d)
        if (t === 'READY') {
          // Ready Event，鉴权成功
          setInterval(() => {
            /**
             * 心跳定时发送
             */
            if (this.#isConnected) {
              this.#ws.send(
                JSON.stringify({
                  op: 1, //  op = 1
                  d: null // 如果是第一次连接，传null
                })
              )
            }
          }, this.#heartbeat_interval)
        } else if (t === 'RESUMED') {
          // Resumed Event，恢复连接成功
        } else {
          // 处理不同类型的事件内容
        }
      },
      7: message => {
        console.info(message)
      },
      9: message => {
        console.info(message)
      },
      10: ({ d }) => {
        // OpCode 10 Hello 消息，处理心跳周期
        this.#isConnected = true
        this.#heartbeat_interval = d.heartbeat_interval
        /**
         * 发送鉴权
         */
        this.#ws.send(JSON.stringify(this.#art()))
      },
      11: message => {
        console.info('[ws] heartbeat transmission')
      },
      12: message => {
        console.info(message)
      }
    }

    this.#ws = new WebSocket(this.#url)

    this.#ws.on('open', () => {
      console.info('[ws] open')
    })

    this.#ws.on('message', msg => {
      const message = JSON.parse(msg.toString('utf8'))
      // 根据 opcode 进行处理
      if (process.env.QQ_WS == 'dev') console.info('message', message)
      if (map[message.op]) map[message.op](message)
    })

    this.#ws.on('close', () => {
      console.error('[ws]  close')
    })
  }
}
