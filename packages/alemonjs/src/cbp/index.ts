/**
 * CBP: Chatbot Protocol
 * @description 聊天机器人协议
 *
 *              转发&格式化               格式化                   原始
 * AL Clinet  <---------> CBP(server) <---------> AL Platform  <---------> Platform(server)
 *               行为                    转发&行为                行为API
 */
import Koa from 'koa'
import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import MessageRouter from './router'
import { onProcessor } from '../post'
import { Actions } from '../typing/actions'

const client: {
  [key: string]: WebSocket | undefined
} = {}

const platformClient: {
  [key: string]: WebSocket | undefined
} = {}

// 行为回调
const actionResolves = new Map<string, (data: Actions) => void>()
// 超时器
const actionTimeouts = new Map<string, NodeJS.Timeout>()
// 生成唯一标识符
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
// 超时时间
const timeoutTime = 1000 * 12 // 12秒

// 失败重连
const reconnectInterval = 6000 // 6秒

/**
 * cbp server
 * 一个 nodejs 应用，只允许存在一个 cbp server 连接。
 * @description 创建服务
 * @param port 端口号
 */
export const cbpServer = (port: number, listeningListener?: () => void) => {
  if (global.server) {
    delete global.server
  }
  const app = new Koa()
  app.use(MessageRouter.routes())
  app.use(MessageRouter.allowedMethods())
  const server = app.listen(port, listeningListener)
  // 创建 WebSocketServer 并监听同一个端口
  global.server = new WebSocketServer({ server })
  // 处理客户端连接
  global.server.on('connection', (ws, request) => {
    // 分配一个唯一的 clientId 给每个连接
    const clientId = uuidv4()
    if (typeof clientId !== 'string') {
      return
    }
    // 读取请求头中的 来源
    const headers = request.headers
    const origin = headers['user-agent'] || 'client' // 默认值为 'client'
    // 根据来源进行分类
    if (origin === 'platform') {
      platformClient[clientId] = ws
    } else {
      client[clientId] = ws
    }
    // 处理消息事件
    ws.on('message', (message: string) => {
      // 平台的消息，广播给所有客户端
      // tudo 需要进行负载均衡计算
      if (origin === 'platform') {
        for (const key in client) {
          // 检查状态 并检查状态
          if (client[key] && client[key].readyState === WebSocket.OPEN) {
            client[key]?.send(message)
          }
        }
      } else {
        // 客户端的消息，广播给所有平台
        for (const key in platformClient) {
          // 检查状态 并检查状态
          if (platformClient[key] && platformClient[key].readyState === WebSocket.OPEN) {
            platformClient[key]?.send(message)
          }
        }
      }
    })
    // 处理关闭事件
    ws.on('close', () => {
      if (origin === 'platform') {
        delete platformClient[clientId]
      } else {
        delete client[clientId]
      }
      console.log(clientId, 'disconnected')
    })
  })
}

/**
 * 发送行为
 * @param data
 */
export const sendAction = (data: Actions): Promise<any> => {
  const actionId = generateUniqueId()
  return new Promise(resolve => {
    actionResolves.set(actionId, resolve)
    data.actionID = actionId // 设置唯一标识符
    global.client.send(JSON.stringify(data))
    // 12 秒后超时
    const timeout = setTimeout(() => {
      // 不会当错误进行处理
      resolve(null)
      // 手动清理
      clearTimeout(timeout)
      // 删除回调
      actionResolves.delete(actionId)
      // 删除超时器
      actionTimeouts.delete(actionId)
    }, timeoutTime)
    actionTimeouts.set(actionId, timeout)
  })
}

/**
 * CBP 客户端
 * 一个nodejs应用，只允许存在一个客户端连接。
 * @param url
 * @param onopen
 */
export const cbpClient = (url: string, open = () => {}) => {
  /**
   * 纯 cbpClient 连接，会没有 一些 全局变量。
   * 需要在此处进行判断并设置
   */
  if (!global.client) {
    delete global.client
  }
  const start = () => {
    global.client = new WebSocket(url, {
      headers: {
        'User-Agent': 'client'
      }
    })
    global.client.on('open', open)
    // 接收标准化消息
    global.client.on('message', message => {
      try {
        const parsedMessage = JSON.parse(message.toString())
        if (parsedMessage.actionID) {
          // 如果有 id，说明是一个行为请求
          const resolve = actionResolves.get(parsedMessage.actionID)
          console.log(parsedMessage.actionID, resolve)
          if (resolve) {
            // 清除超时器
            const timeout = actionTimeouts.get(parsedMessage.actionID)
            if (timeout) {
              clearTimeout(timeout)
              actionTimeouts.delete(parsedMessage.actionID)
            }
            // 调用回调函数
            resolve(parsedMessage)
            actionResolves.delete(parsedMessage.actionID)
          }
          return
        }
        onProcessor(parsedMessage.name, parsedMessage, parsedMessage.value)
      } catch (error) {
        console.error('解析消息失败', error)
      }
    })
    global.client.on('close', () => {
      console.log('连接关闭')
      console.log('尝试重新连接...')
      delete global.client
      // 重新连接逻辑
      setTimeout(() => {
        start() // 重新连接
      }, reconnectInterval) // 6秒后重连
    })
  }
  start()
}

type CallbackType = (data: Actions, consume: (data: any) => void) => void

/**
 * CBP 平台
 * 可以创建多个平台连接
 * @param url
 * @param onopen
 * @returns
 */
export const cbpPlatform = (url: string, open = () => {}) => {
  let ws: WebSocket
  /**
   * 发送数据
   * @param data
   */
  const send = (data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }
  const msg: CallbackType[] = []

  // 消费行为
  const consume = (data: Actions, resov: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          action: data.action,
          payload: resov,
          actionID: data.actionID // 保留原始的 actionID
        })
      )
    }
  }

  /**
   * 接收行为
   * @param callBack
   */
  const onactions = (callBack: CallbackType) => {
    msg.push(callBack)
  }

  /**
   * 启动 WebSocket 连接
   */
  const start = () => {
    ws = new WebSocket(url, {
      headers: {
        'User-Agent': 'platform'
      }
    })
    ws.on('open', open)
    ws.on('message', message => {
      try {
        const data = JSON.parse(message.toString())
        for (const cb of msg) {
          cb(
            data,
            // 传入一个消费函数
            val => consume(data, val)
          )
        }
      } catch (error) {
        console.error('解析消息失败', error)
      }
    })
    ws.on('close', () => {
      console.log('连接关闭')
      console.log('尝试重新连接...')
      ws = null
      // 重新连接逻辑
      setTimeout(() => {
        start() // 重新连接
      }, reconnectInterval) // 6秒后重连
    })
  }

  start()

  const client = {
    send,
    onactions
  }
  return client
}
