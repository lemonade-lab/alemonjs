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
// 映射关系
const idClientMap: { [id: string]: string } = {}

/**
 * 分流消息到对应客户端
 * @param Id 目标 id
 * @param data 消息体
 */
function dispatchToClients(Id: string, data: any) {
  // 先查找是否有绑定的客户端
  const bindClientKey = idClientMap[Id]
  if (
    bindClientKey &&
    childrenClient.has(bindClientKey) &&
    childrenClient.get(bindClientKey).readyState === WebSocket.OPEN
  ) {
    childrenClient.get(bindClientKey).send(JSON.stringify(data))
    return
  }

  // 没有绑定则分派给绑定数最少的可用客户端
  const availableClients = Array.from(childrenClient.entries()).filter(
    ([key, ws]) => key !== deviceId && ws && ws.readyState === WebSocket.OPEN
  )

  if (availableClients.length > 0) {
    // 统计每个客户端已绑定的 id 数量
    const clientBindCount: { [key: string]: number } = {}
    for (const [key] of availableClients) {
      clientBindCount[key] = Object.values(idClientMap).filter(v => v === key).length
    }
    // 找到绑定数最少的客户端
    let minCount = Infinity
    let minClients: string[] = []
    for (const [key] of availableClients) {
      if (clientBindCount[key] < minCount) {
        minCount = clientBindCount[key]
        minClients = [key]
      } else if (clientBindCount[key] === minCount) {
        minClients.push(key)
      }
    }
    // 多个最少绑定，随机选一个
    const selectedKey = minClients[Math.floor(Math.random() * minClients.length)]
    const selectedWs = childrenClient.get(selectedKey)
    if (selectedWs && selectedWs.readyState === WebSocket.OPEN) {
      selectedWs.send(JSON.stringify(data))
      // 建立绑定关系
      idClientMap[Id] = selectedKey
    }
  }
}

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
  global.server = new WebSocketServer({ server })
  // 处理客户端连接
  global.server.on('connection', (ws, request) => {
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
    } else {
      childrenClient.set(originId, ws)
    }
    // 处理消息事件
    ws.on('message', (message: string) => {
      // 平台的消息，广播给所有客户端
      if (origin === 'platform') {
        // 得到客户端数量
        const clientCount = Object.keys(client).length
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
            const id =
              parsedMessage.userId ||
              parsedMessage.userID ||
              parsedMessage.channelId ||
              parsedMessage.channelID
            dispatchToClients(id, parsedMessage)
          }
        } catch (error) {
          logger.error({
            code: ResultCode.Fail,
            message: '解析平台消息失败',
            data: error
          })
          return
        }
      } else {
        // 客户端的消息，广播给所有平台
        platformClient.forEach((clientWs, clientId) => {
          // 检查状态 并检查状态
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(message)
          } else {
            // 如果连接已关闭，删除该客户端
            platformClient.delete(clientId)
          }
        })
      }
    })
    // 处理关闭事件
    ws.on('close', () => {
      if (origin === 'platform') {
        delete platformClient[originId]
      } else {
        delete client[originId]
      }
      logger.debug({
        code: ResultCode.Fail,
        message: `Client ${originId} disconnected`,
        data: null
      })
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
    // 设置设备 ID
    data.DeviceId = deviceId
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
        [USER_AGENT_HEADER]: 'platform',
        [DEVICE_ID_HEADER]: deviceId
      }
    })
    global.client.on('open', open)
    // 接收标准化消息
    global.client.on('message', message => {
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
    global.client.on('close', () => {
      logger.debug({
        code: ResultCode.Fail,
        message: '连接关闭，尝试重新连接...',
        data: null
      })
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
          actionID: data.actionID,
          DeviceId: deviceId
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
        [USER_AGENT_HEADER]: 'platform',
        [DEVICE_ID_HEADER]: deviceId
      }
    })
    ws.on('open', open)
    ws.on('message', message => {
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
            val => consume(data, val)
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
    ws.on('close', () => {
      logger.debug({
        code: ResultCode.Fail,
        message: '平台连接关闭，尝试重新连接...',
        data: null
      })
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
