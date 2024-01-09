import WebSocket from 'ws'
import axios from 'axios'
import { Counter } from './counter.js'
import { createMessage, parseMessage } from './data.js'
import { ProtoCommand, ProtoModel } from './proto.js'
import { config, type ClientConfig } from './config.js'
const counter = new Counter(1) // 初始值为1
/**
 * 别野服务
 * @param villa_id 别野编号
 * @param config 配置
 * @returns
 */
export async function getWebsocketInfo(
  bot_id: string,
  bot_secret: string
): Promise<{
  data: {
    uid: number
    websocket_url: string
    websocket_conn_uid: number
    app_id: number
    platform: number
    device_id: string
  }
}> {
  return await axios({
    baseURL: 'https://bbs-api.miyoushe.com', // 地址
    timeout: 6000, // 响应
    headers: {
      'x-rpc-bot_id': bot_id, // 账号
      'x-rpc-bot_secret': bot_secret // 密码
    },
    url: '/vila/api/bot/platform/getWebsocketInfo',
    method: 'get'
  }).then(res => res.data)
}
/**
 *
 * @param options
 * @param conversation
 * @returns
 */
export async function createClient(
  options: ClientConfig,
  conversation: (...args: any[]) => any
) {
  config.set('bot_id', options.bot_id)
  config.set('bot_secret', options.bot_secret)
  config.set('pub_key', options.pub_key)
  config.set('token', options.token)
  config.set('villa_id', options?.villa_id ?? 0)
  const data = await getWebsocketInfo(options.bot_id, options.bot_secret).then(
    res => res.data
  )
  if (!data?.websocket_url) {
    console.info('[getway] secret err')
    return
  }

  let IntervalID = null

  let size = 0

  const time = 20 * 1000

  const getLoginData = () => {
    return {
      ID: counter.getNextID(),
      Flag: 1, // 发送
      BizType: 7,
      AppId: data.app_id,
      BodyData: ProtoCommand('PLogin').encode({
        uid: data.uid,
        token: options.token,
        platform: data.platform,
        appId: data.app_id,
        deviceId: data.device_id,
        region: '',
        meta: null
      })
    }
  }

  const ws = new WebSocket(data.websocket_url)
  ws.on('open', async () => {
    console.info('[ws] login open')
    // login
    ws.send(createMessage(getLoginData()))
  })

  ws.on('message', message => {
    if (Buffer.isBuffer(message)) {
      try {
        const obj = parseMessage(new Uint8Array(message))
        if (!obj) return
        if (obj.bizType == 7) {
          // 登录
          const reply = ProtoCommand('PLoginReply').decode(obj.BodyData)
          if (process.env?.VILLA_WS == 'dev') {
            console.info('PLoginReply:', LongToNumber(reply))
          }
          if (reply.code) console.info('[ws] login err')
          else {
            console.info('[ws] login success')
            size = 0
            // 20s 心跳
            IntervalID = setInterval(() => {
              ws.send(
                createMessage({
                  ID: counter.getNextID(),
                  Flag: 1, // 发送
                  BizType: 6,
                  AppId: data.app_id,
                  BodyData: ProtoCommand('PHeartBeat').encode({
                    clientTimestamp: `${new Date().getTime()}`
                  })
                })
              )
            }, time)
          }
        } else if (obj.bizType == 6) {
          // 心跳
          const reply = ProtoCommand('PHeartBeatReply').decode(obj.BodyData)
          if (process.env?.VILLA_WS == 'dev') {
            console.info('PHeartBeatReply:', LongToNumber(reply))
          }
          if (reply.code) {
            console.info('[ws] 心跳错误')
            // 心跳错误,关闭心跳记时器
            if (IntervalID) clearInterval(IntervalID)
            if (size < 5) {
              // 重新发送鉴权
              ws.send(createMessage(getLoginData()))
            } else {
              console.info('重鉴权次数上限')
            }
          }
        } else if (obj.bizType == 8) {
          // 退出登录
          const reply = ProtoCommand('PLogoutReply').decode(obj.BodyData)
          if (process.env?.VILLA_WS == 'dev')
            console.info('PLogoutReply:', LongToNumber(reply))
        } else if (obj.bizType == 53) {
          // 强制下线
        } else if (obj.bizType == 52) {
          // 服务器关机
        } else if (obj.bizType == 30001) {
          // 回调数据包
          const reply = ProtoModel('RobotEvent').decode(obj.BodyData)
          const data = LongToNumber(reply)
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

  ws.on('error', error => {
    console.info('[ws] close', error)
  })
}

/**
 * long数据转为number
 * @param obj
 * @returns
 */
function LongToNumber(obj: any) {
  if (typeof obj == 'string') return obj
  if (typeof obj == 'number') return obj
  if (obj !== null && typeof obj == 'object') {
    if (Array.isArray(obj)) {
      // 递归处理数组中的每个元素
      return obj.map(item => LongToNumber(item))
    } else if (typeof obj?.low == 'number' && typeof obj?.high == 'number') {
      return Number(obj)
    } else {
      const result: any = {}
      for (const key in obj) {
        // 递归处理对象的每个属性
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = LongToNumber(obj[key])
        }
      }
      return result
    }
  } else {
    return obj
  }
}
