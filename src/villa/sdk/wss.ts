import WebSocket from 'ws'
import axios from 'axios'
import { Counter } from '../../core/index.js'
import { createMessage, parseMessage } from './data.js'
import { ProtoCommand, ProtoModel } from './proto.js'
import { config } from './config.js'
import { ApiLog } from './log.js'
import { hmacSha256 } from './hs.js'

/**
 * ****
 * villa
 * *****
 */
export interface VILLAOptions {
  /**
   * 机器人编号
   */
  bot_id: string
  /**
   * 密钥
   */
  secret: string
  /**
   * 公匙
   */
  pub_key: string
  /**
   * 主人编号
   */
  masterID?: string
  /**
   * 别野
   */
  villa_id: number
}

/**
 * 默认值
 */
export const defineVILLA = {
  bot_id: '',
  secret: '',
  pub_key: '',
  masterID: '',
  villa_id: 0
}

/**
 * 连接客户端
 */
export class Client {
  // 初始值为1
  #ID = new Counter(1)
  // 重连次数
  #counter = new Counter(0)
  // 编号
  #IntervalID = null
  // 发送
  #time = 20 * 1000
  // 数据
  #data: {
    uid: number
    websocket_url: string
    websocket_conn_uid: number
    app_id: number
    platform: number
    device_id: string
  }
  /**
   * 得到鉴权
   * @returns
   */
  async #gateway(): Promise<{
    data: {
      uid: number
      websocket_url: string
      websocket_conn_uid: number
      app_id: number
      platform: number
      device_id: string
    }
  }> {
    const bot_id = config.get('bot_id')
    const bot_secret = config.get('bot_secret')
    return await axios({
      baseURL: 'https://bbs-api.miyoushe.com', // 地址
      timeout: 6000, // 响应
      headers: {
        'x-rpc-bot_id': bot_id, // 账号
        'x-rpc-bot_secret': bot_secret // 密码
      },
      url: '/vila/api/bot/platform/getWebsocketInfo',
      method: 'get'
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 设置配置
   * @param options
   */
  set(options: VILLAOptions) {
    config.set('bot_id', options.bot_id)

    config.set(
      'bot_secret',
      options?.pub_key
        ? hmacSha256(options.secret, options.pub_key)
        : options.secret
    )
    config.set('pub_key', options.pub_key)
    config.set(
      'token',
      `${options.villa_id}.${options.secret}.${options.bot_id}`
    )
    config.set('villa_id', options?.villa_id ?? 0)
  }

  /**
   * login配置
   * @returns
   */
  #getLoginData() {
    return {
      ID: this.#ID.getNextID(),
      Flag: 1, // 发送
      BizType: 7,
      AppId: this.#data.app_id,
      BodyData: ProtoCommand('PLogin').encode({
        uid: this.#data.uid,
        token: config.get('token'),
        platform: this.#data.platform,
        appId: this.#data.app_id,
        deviceId: this.#data.device_id,
        region: '',
        meta: null
      })
    }
  }

  #ws: WebSocket

  /**
   * 连接
   * @param conversation
   * @returns
   */
  async connect(conversation: (...args: any[]) => any) {
    this.#data = await this.#gateway().then(res => res.data)
    if (!this.#data?.websocket_url) {
      console.info('[getway] secret err')
      return
    }

    this.#ws = new WebSocket(this.#data.websocket_url)
    this.#ws.on('open', async () => {
      console.info('[ws] login open')
      // login
      this.#ws.send(createMessage(this.#getLoginData()))
    })

    this.#ws.on('message', message => {
      if (Buffer.isBuffer(message)) {
        try {
          const obj = parseMessage(new Uint8Array(message))
          if (!obj) return
          if (obj.bizType == 7) {
            // 登录
            const reply = ProtoCommand('PLoginReply').decode(obj.BodyData)
            if (process.env?.VILLA_WS == 'dev') {
              console.info('PLoginReply:', this.#longToNumber(reply))
            }
            if (reply.code) console.info('[ws] login err')
            else {
              console.info('[ws] login success')
              this.#counter.reStart()
              // 20s 心跳
              this.#IntervalID = setInterval(() => {
                this.#ws.send(
                  createMessage({
                    ID: this.#ID.getNextID(),
                    Flag: 1, // 发送
                    BizType: 6,
                    AppId: this.#data.app_id,
                    BodyData: ProtoCommand('PHeartBeat').encode({
                      clientTimestamp: `${new Date().getTime()}`
                    })
                  })
                )
              }, this.#time)
            }
          } else if (obj.bizType == 6) {
            // 心跳
            const reply = ProtoCommand('PHeartBeatReply').decode(obj.BodyData)
            if (process.env?.VILLA_WS == 'dev') {
              console.info('PHeartBeatReply:', this.#longToNumber(reply))
            }
            if (reply.code) {
              console.info('[ws] 心跳错误')
              // 心跳错误,关闭心跳记时器
              if (this.#IntervalID) clearInterval(this.#IntervalID)
              if (this.#counter.get() < 5) {
                // 重新发送鉴权
                this.#ws.send(createMessage(this.#getLoginData()))
              } else {
                console.info('重鉴权次数上限')
              }
            }
          } else if (obj.bizType == 8) {
            // 退出登录
            const reply = ProtoCommand('PLogoutReply').decode(obj.BodyData)
            if (process.env?.VILLA_WS == 'dev')
              console.info('PLogoutReply:', this.#longToNumber(reply))
          } else if (obj.bizType == 53) {
            // 强制下线
          } else if (obj.bizType == 52) {
            // 服务器关机
          } else if (obj.bizType == 30001) {
            // 回调数据包
            const reply = ProtoModel('RobotEvent').decode(obj.BodyData)
            const data = this.#longToNumber(reply)
            if (process.env?.VILLA_WS == 'dev') console.info('data', data)
            conversation(data)
          } else {
            if (process.env?.VILLA_WS == 'dev') console.info('未知数据')
          }
        } catch {
          if (process.env?.VILLA_WS == 'dev') console.info('代码错误')
        }
      } else {
        if (process.env?.VILLA_WS == 'dev') console.info('未知数据')
      }
    })

    this.#ws.on('error', error => {
      console.info('[ws] close', error)
    })
  }

  /**
   * long数据转为number
   * @param obj
   * @returns
   */
  #longToNumber(obj: any) {
    if (typeof obj == 'string') return obj
    if (typeof obj == 'number') return obj
    if (obj !== null && typeof obj == 'object') {
      if (Array.isArray(obj)) {
        // 递归处理数组中的每个元素
        return obj.map(item => this.#longToNumber(item))
      } else if (typeof obj?.low == 'number' && typeof obj?.high == 'number') {
        return Number(obj)
      } else {
        const result: any = {}
        for (const key in obj) {
          // 递归处理对象的每个属性
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = this.#longToNumber(obj[key])
          }
        }
        return result
      }
    } else {
      return obj
    }
  }
}
