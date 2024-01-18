import WebSocket from 'ws'
import { ClientQQ } from './api.js'
import { config } from './config.js'
import { getIntentsMask } from './intents.js'
import { IntentsEnum } from './typings.js'
import { Counter } from '../../core/index.js'
import { ReStart } from '../../core/index.js'

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
  #counter = new Counter(1) // 初始值为1

  // 存储最新的消息序号
  #heartbeat_interval = 30000

  // 鉴权
  #IntervalID = null

  //
  #at = new ReStart(3)

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

    const map = {
      0: async ({ t, d }) => {
        // Ready Event，鉴权成功
        if (t === 'READY') {
          //
          clearTimeout(this.#IntervalID)

          // 重启成功
          this.#at.del()

          // 发送回复
          this.#IntervalID = setInterval(() => {
            this.#ws.send(
              JSON.stringify({
                op: 1, //  op = 1
                d: null // 如果是第一次连接，传null
              })
            )
          }, this.#heartbeat_interval)
        }

        // Resumed Event，恢复连接成功
        if (t === 'RESUMED') {
          console.info('[ws] restore connection')
        }

        // 存在,则执行t对应的函数
        conversation(t, d)

        return
      },
      6: ({ d }) => {
        console.info('[ws] connection attempt', d)
        return
      },
      7: async ({ d }) => {
        // 请求重连
        console.info('[ws] reconnect', d)
        // 尝试重连
        this.#timeout(map)
        return
      },
      9: ({ d, t }) => {
        // 错误
        console.info('[ws] parameter error', d)
        // 尝试重连
        this.#timeout(map)
        return
      },
      // 打招呼
      10: ({ d }) => {
        // 记录新循环
        this.#heartbeat_interval = d.heartbeat_interval
        // 发送鉴权
        this.#ws.send(JSON.stringify(this.#aut()))
        return
      },
      11: () => {
        // OpCode 11 Heartbeat ACK 消息，心跳发送成功
        console.info('[ws] heartbeat transmission')
        return
      },
      12: ({ d }) => {
        console.info('[ws] platform data', d)
        return
      }
    }

    this.#start(map)
  }

  #start(map: any) {
    // 连接
    this.#ws = new WebSocket(this.#gatewayUrl)
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
