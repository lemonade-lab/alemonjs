import WebSocket from 'ws'
import axios, { AxiosRequestConfig } from 'axios'
import { getClientConfig } from './config.js'
import { Counter } from './counter.js'
import { createMessage, parseMessage } from './data.js'
import { ProtoCommand, ProtoModel } from './proto.js'

const counter = new Counter(1) // 初始值为1

/**
 * 别野服务
 * @param villa_id 别野编号
 * @param config 配置
 * @returns
 */
async function wsService(config: AxiosRequestConfig) {
  const ClientCfg = getClientConfig()
  const service = axios.create({
    baseURL: 'https://bbs-api.miyoushe.com', // 地址
    timeout: 6000, // 响应
    headers: {
      'x-rpc-bot_id': ClientCfg.bot_id, // 账号
      'x-rpc-bot_secret': ClientCfg.bot_secret // 密码
    }
  })
  return await service(config)
}

async function getWebsocketInfo(): Promise<{
  data: {
    uid: number
    websocket_url: string
    websocket_conn_uid: number
    app_id: number
    platform: number
    device_id: string
  }
}> {
  return await wsService({
    url: '/vila/api/bot/platform/getWebsocketInfo',
    method: 'get'
  }).then(res => res.data)
}

export async function createClientWS() {
  const data = await getWebsocketInfo().then(res => res.data)
  const ClientCfg = getClientConfig()
  if (!data?.websocket_url) return
  const ws = new WebSocket(data.websocket_url)
  ws.on('open', async () => {
    console.log('open')

    // login
    ws.send(
      createMessage({
        ID: counter.getNextID(),
        Flag: 1, // 发送
        BizType: 7,
        AppId: data.app_id,
        BodyData: ProtoCommand('PLogin').encode({
          uid: data.uid,
          token: `8488.${ClientCfg.bot_secret}.${ClientCfg.bot_id}`,
          platform: data.platform,
          appId: data.app_id,
          deviceId: data.device_id,
          region: '',
          meta: null
        })
      })
    )

    // 6s 心跳
    setInterval(() => {
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
    }, 20 * 1000)
  })

  ws.on('message', message => {
    if (Buffer.isBuffer(message)) {
      try {
        const obj = parseMessage(new Uint8Array(message))
        if (!obj) return
        if (obj.bizType == 7) {
          // 登录
          const reply = ProtoCommand('PLoginReply').decode(obj.BodyData)
          console.log('PLoginReply:', LongToNumber(reply))
        } else if (obj.bizType == 6) {
          const reply = ProtoCommand('PHeartBeatReply').decode(obj.BodyData)
          console.log('PHeartBeatReply:', LongToNumber(reply))
        } else if (obj.bizType == 8) {
          // 退出登录
        } else if (obj.bizType == 53) {
          // 强制下线
        } else if (obj.bizType == 52) {
          // 服务器关机
        } else if (obj.bizType == 30001) {
          // 回调数据包
          const reply = ProtoModel('RobotEvent').decode(obj.BodyData)
          console.log('RobotEvent:', LongToNumber(reply))
        } else {
          console.log('obj', obj)
          // ProtoModel
        }
      } catch {
        console.log('错误数据')
      }
    }
  })

  ws.on('error', error => {
    console.error('WebSocket error:', error)
  })
}

/**
 * long数据转为number
 * @param obj
 * @returns
 */
function LongToNumber(obj: any) {
  if (obj !== null) {
    if (typeof obj == 'string') return obj
    if (typeof obj?.low == 'number') {
      return Number(obj)
    } else if (Array.isArray(obj)) {
      // 递归处理数组中的每个元素
      return obj.map(item => LongToNumber(item))
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
