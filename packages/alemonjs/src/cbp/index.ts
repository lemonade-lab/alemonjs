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
import koaStatic from 'koa-static'
import koaCors from '@koa/cors'
import { ResultCode } from '../core/code'
import { EventsEnum } from '../typings'
const platformClient = new Map<string, WebSocket>()
const childrenClient = new Map<string, WebSocket>()
const deviceId = uuidv4()
const USER_AGENT_HEADER = 'user-agent'
const DEVICE_ID_HEADER = 'x-device-id'
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
  if (global.chatbotServer) {
    delete global.chatbotServer
  }
  const app = new Koa()
  app.use(MessageRouter.routes())
  app.use(MessageRouter.allowedMethods())
  // 读取静态文件夹 gui
  app.use(koaStatic('/gui'))
  // 允许跨域
  app.use(
    koaCors({
      origin: '*', // 允许所有来源
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] // 允许的 HTTP 方法
    })
  )
  const server = app.listen(port, listeningListener)
  // 创建 WebSocketServer 并监听同一个端口
  global.chatbotServer = new WebSocketServer({ server })

  /**
   *
   * @param originId
   * @param ws
   */
  const setPlatformClient = (originId: string, ws: WebSocket) => {
    // 处理消息事件
    ws.on('message', (message: string) => {
      // 平台的消息，广播给所有客户端
      const clientCount = Object.keys(childrenClient).length
      try {
        const parsedMessage = JSON.parse(message.toString())
        // 如果消息中有 actionID，说明是一个行为请求
        if (parsedMessage?.actionID || (parsedMessage?.name && clientCount <= 1)) {
          // 请求行为的结果。不进行分流。
          // 连接数量小于等于1时，直接发送给客户端
          childrenClient.forEach((clientWs, clientId) => {
            // 检查状态 并检查状态
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(message)
            } else {
              // 如果连接已关闭，删除该客户端
              childrenClient.delete(clientId)
            }
          })
        } else if (parsedMessage?.name) {
          // 如果消息中有 name，说明是一个事件请求
          childrenClient.forEach((clientWs, clientId) => {
            // 检查状态 并检查状态
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(message)
            } else {
              // 如果连接已关闭，删除该客户端
              childrenClient.delete(clientId)
            }
          })
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析平台消息失败',
          data: error
        })
        return
      }
    })

    // 处理关闭事件
    ws.on('close', () => {
      delete platformClient[originId]
      logger.debug({
        code: ResultCode.Fail,
        message: `Client ${originId} disconnected`,
        data: null
      })
    })
  }

  /**
   *
   * @param originId
   * @param ws
   */
  const setChildrenClient = (originId: string, ws: WebSocket) => {
    // 处理消息事件
    ws.on('message', (message: string) => {
      const parsedMessage = JSON.parse(message.toString())

      // 发送者 actino 不一样。识别不了吧？

      const DeviceId = parsedMessage.DeviceId
      if (!platformClient.has(DeviceId)) {
        // 转发给平台客户端
        const platformWs = platformClient.get(DeviceId)
        if (platformWs.readyState === WebSocket.OPEN) {
          platformWs.send(message)
        } else {
          // 如果连接已关闭，删除该平台客户端
          platformClient.delete(DeviceId)
        }
      }

      // 收到了这个平台的消息。
      // 意味着。设备 和 平台进行了绑定。
      // 客户端不能再处理别的消息。
    })
    // 处理关闭事件
    ws.on('close', () => {
      delete childrenClient[originId]
      logger.debug({
        code: ResultCode.Fail,
        message: `Client ${originId} disconnected`,
        data: null
      })
    })
  }

  // 处理客户端连接
  global.chatbotServer.on('connection', (ws, request) => {
    // 读取请求头中的 来源
    const headers = request.headers
    const origin = headers['user-agent'] || 'client' // 默认值为 'client'
    // 来源id
    const originId = headers['x-origin-id'] as string
    logger.debug({
      code: ResultCode.Ok,
      message: `Client ${originId} connected`,
      data: null
    })
    // 根据来源进行分类
    if (origin === 'platform') {
      platformClient.set(originId, ws)
      setPlatformClient(originId, ws)
      return
    }
    childrenClient.set(originId, ws)
    setChildrenClient(originId, ws)
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
    // 设置设备 ID
    data.DeviceId = deviceId
    global.chatbotClient.send(JSON.stringify(data))
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
 * @param url
 * @param onopen
 */
export const cbpClient = (url: string, open = () => {}) => {
  /**
   * 纯 cbpClient 连接，会没有 一些 全局变量。
   * 需要在此处进行判断并设置
   */
  if (!global.chatbotClient) {
    delete global.chatbotClient
  }
  const start = () => {
    global.chatbotClient = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: 'platform',
        [DEVICE_ID_HEADER]: deviceId
      }
    })
    global.chatbotClient.on('open', open)
    // 接收标准化消息
    global.chatbotClient.on('message', message => {
      try {
        const parsedMessage = JSON.parse(message.toString())
        logger.debug({
          code: ResultCode.Ok,
          message: '接收到消息',
          data: parsedMessage
        })
        if (parsedMessage?.actionID) {
          // 如果有 id，说明是一个行为请求
          const resolve = actionResolves.get(parsedMessage.actionID)
          if (resolve) {
            // 清除超时器
            const timeout = actionTimeouts.get(parsedMessage.actionID)
            if (timeout) {
              clearTimeout(timeout)
              actionTimeouts.delete(parsedMessage.actionID)
            }
            // 调用回调函数
            resolve(parsedMessage.payload)
            actionResolves.delete(parsedMessage.actionID)
          }
          return
        } else if (parsedMessage.name) {
          onProcessor(parsedMessage.name, parsedMessage, parsedMessage.value)
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析消息失败',
          data: error
        })
      }
    })
    global.chatbotClient.on('close', () => {
      logger.debug({
        code: ResultCode.Fail,
        message: '连接关闭，尝试重新连接...',
        data: null
      })
      delete global.chatbotClient
      // 重新连接逻辑
      setTimeout(() => {
        start() // 重新连接
      }, reconnectInterval) // 6秒后重连
    })
  }
  start()
}

type ReplyFunc = (data: Actions, consume: (payload: any) => void) => void

/**
 * CBP 平台
 * 可以创建多个平台连接
 * @param url
 * @param onopen
 * @returns
 */
export const cbpPlatform = (url: string, open = () => {}) => {
  if (!global.chatbotPlatform) {
    delete global.chatbotPlatform
  }

  /**
   * 发送数据
   * @param data
   */
  const send = (data: EventsEnum) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      data.DeviceId = deviceId // 设置设备 ID
      global.chatbotPlatform.send(JSON.stringify(data))
    }
  }
  const msg: ReplyFunc[] = []

  /**
   * 消费数据
   * @param data
   * @param payload
   */
  const reply = (data: Actions, payload: any) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      global.chatbotPlatform.send(
        JSON.stringify({
          action: data.action,
          payload: payload,
          actionID: data.actionID,
          DeviceId: data.DeviceId
        })
      )
    }
  }

  /**
   * 接收行为
   * @param reply
   */
  const onactions = (reply: ReplyFunc) => {
    msg.push(reply)
  }

  /**
   * 启动 WebSocket 连接
   */
  const start = () => {
    global.chatbotPlatform = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: 'platform',
        [DEVICE_ID_HEADER]: deviceId
      }
    })
    global.chatbotPlatform.on('open', open)
    global.chatbotPlatform.on('message', message => {
      try {
        const data = JSON.parse(message.toString())
        logger.debug({
          code: ResultCode.Ok,
          message: '平台接收消息',
          data: data
        })
        for (const cb of msg) {
          cb(
            data,
            // 传入一个消费函数
            val => reply(data, val)
          )
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '解析消息失败',
          data: error
        })
      }
    })
    global.chatbotPlatform.on('close', () => {
      logger.debug({
        code: ResultCode.Fail,
        message: '平台连接关闭，尝试重新连接...',
        data: null
      })
      delete global.chatbotPlatform
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
