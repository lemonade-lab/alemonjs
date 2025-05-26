/**
 * CBP: Chatbot Protocol
 * @description 聊天机器人协议
 *
 *              转发&格式化               格式化                   原始
 * AL Clinet  <---------> CBP(server) <---------> AL Platform  <---------> Platform(server)
 *               行为                    转发&行为                行为API
 *
 * CBP server 只允许 AL Platform 存在一个连接。允许 多个 AL Client 连接。
 * AL Client 默认全量接收消息。也可以进行进入分流模式
 *
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
// 子客户端
const childrenClient = new Map<string, WebSocket>()
// 平台客户端
const platformClient = new Map<string, WebSocket>()
// 全量客户端
const fullClient = new Map<string, WebSocket>()
const deviceId = uuidv4()
// 连接类型
const USER_AGENT_HEADER = 'user-agent'
// 设备 ID
const DEVICE_ID_HEADER = 'x-device-id'
// 是否全量接收
const FULL_RECEIVE_HEADER = 'x-full-receive'
// 行为回调
const actionResolves = new Map<string, (data: Actions) => void>()
// 超时器
const actionTimeouts = new Map<string, NodeJS.Timeout>()
// 分配绑定记录
const childrenBind = new Map<string, string>()
// 生成唯一标识符
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
// 超时时间
const timeoutTime = 1000 * 12 // 12秒
// 失败重连
const reconnectInterval = 6000 // 6秒

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
    // 仅允许有一个平台连接
    if (platformClient.size > 0) {
      logger.error({
        code: ResultCode.Fail,
        message: `平台连接已存在: ${originId}`,
        data: null
      })
      ws.close() // 关闭新连接
      return
    }
    // 设置平台客户端
    platformClient.set(originId, ws)
    // 得到平台客户端的消息
    ws.on('message', (message: string) => {
      try {
        // 解析消息
        const parsedMessage = JSON.parse(message.toString())
        // 1. 解析得到 actionID ，说明是消费行为请求。要广播告诉所有客户端。
        // 2. 解析得到 name ，说明是一个事件请求。
        if (parsedMessage?.actionID) {
          // 指定的设备 处理消费。终端有记录每个客户端是谁
          const DeviceId = parsedMessage.DeviceId
          if (childrenClient.has(DeviceId)) {
            const clientWs = childrenClient.get(DeviceId)
            if (clientWs && clientWs.readyState === WebSocket.OPEN) {
              // 发送消息到指定的子客户端
              clientWs.send(message)
            } else {
              // 如果连接已关闭，删除该客户端
              childrenClient.delete(DeviceId)
            }
          } else if (fullClient.has(DeviceId)) {
            const clientWs = fullClient.get(DeviceId)
            if (clientWs && clientWs.readyState === WebSocket.OPEN) {
              // 发送消息到指定的全量客户端
              clientWs.send(message)
            } else {
              // 如果连接已关闭，删除该客户端
              fullClient.delete(DeviceId)
            }
          }
        } else if (parsedMessage?.name) {
          // 全量客户端
          fullClient.forEach((clientWs, clientId) => {
            // 检查状态 并检查状态
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(message)
            } else {
              // 如果连接已关闭，删除该客户端
              childrenClient.delete(clientId)
            }
          })
          // 根据所在群进行分流。
          // 确保同一个频道的消息。都流向同一个客户端。
          const ID = parsedMessage.ChannelId || parsedMessage.GuildId || parsedMessage.DeviceId
          if (!ID) {
            logger.error({
              code: ResultCode.Fail,
              message: '消息缺少标识符 ID',
              data: null
            })
            return
          }
          // 重新绑定并发送消息
          const reBind = () => {
            if (childrenClient.size === 0) {
              return
            } else if (childrenClient.size === 1) {
              // 只有一个客户端，直接绑定
              const [bindId, clientWs] = childrenClient.entries().next().value
              childrenBind.set(ID, bindId)
              clientWs.send(message)
              return
            }
            // 有多个客户端，找到绑定最少的那个。
            // 如果大家都一样。就拿最近的第一个直接绑定。
            let minBindCount = Infinity
            let bindId: string | null = null
            childrenClient.forEach((_, id) => {
              const count = Array.from(childrenBind.values()).filter(v => v === id).length
              if (count < minBindCount) {
                minBindCount = count
                bindId = id
              }
            })
            if (bindId) {
              const clientWs = childrenClient.get(bindId)
              if (clientWs && clientWs.readyState === WebSocket.OPEN) {
                // 进行绑定
                childrenBind.set(ID, bindId)
                // 发送消息到绑定的客户端
                clientWs.send(message)
              } else {
                // 如果连接已关闭，删除该客户端
                childrenClient.delete(bindId)
                // 重新进行绑定
                reBind()
              }
            } else {
              logger.error({
                code: ResultCode.Fail,
                message: '出现意外，无法绑定客户端',
                data: null
              })
            }
          }
          // 判断该id是否被分配过
          if (!childrenBind.has(ID)) {
            // 进行绑定
            reBind()
            return
          }
          const bindId = childrenBind.get(ID)
          if (!childrenClient.has(bindId)) {
            // 出现意外。
            // 重新进行绑定。
            reBind()
            return
          }
          const clientWs = childrenClient.get(bindId)
          if (!clientWs || clientWs.readyState !== WebSocket.OPEN) {
            // 如果连接已关闭，删除该客户端
            childrenClient.delete(bindId)
            // 重新进行绑定
            reBind()
            return
          }
          clientWs.send(message)
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

  // 设置子客户端
  const setChildrenClient = (originId: string, ws: WebSocket) => {
    childrenClient.set(originId, ws)
    // 得到子客户端的消息。只会是actions请求。
    ws.on('message', (message: string) => {
      // tudo
      // 为什么 子客户端的行为，不携带目标平台的 DeviceId？
      // 导致无法进行多个平台连接。
      if (platformClient.size > 0) {
        platformClient.forEach(platformWs => {
          // 检查平台客户端状态
          if (platformWs.readyState === WebSocket.OPEN) {
            platformWs.send(message)
          } else {
            // 如果连接已关闭，删除该平台客户端
            platformClient.delete(originId)
          }
        })
      }
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

  // 全量客户端
  const setFullClient = (originId: string, ws: WebSocket) => {
    fullClient.set(originId, ws)
    // 处理消息事件
    ws.on('message', (message: string) => {
      // tudo
      // 为什么 子客户端的行为，不携带目标平台的 DeviceId？
      // 导致无法进行多个平台连接。
      if (platformClient.size > 0) {
        platformClient.forEach(platformWs => {
          // 检查平台客户端状态
          if (platformWs.readyState === WebSocket.OPEN) {
            platformWs.send(message)
          } else {
            // 如果连接已关闭，删除该平台客户端
            platformClient.delete(originId)
          }
        })
      }
    })
    // 处理关闭事件
    ws.on('close', () => {
      delete fullClient[originId]
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
    const origin = headers[USER_AGENT_HEADER] || 'client'
    // 来源id
    const originId = headers[DEVICE_ID_HEADER] as string
    if (!originId) {
      // 如果没有来源 ID，拒绝连接
      ws.close(4000, 'Missing Device ID')
      return
    }
    logger.debug({
      code: ResultCode.Ok,
      message: `Client ${originId} connected`,
      data: null
    })
    // 根据来源进行分类
    if (origin === 'platform') {
      setPlatformClient(originId, ws)
      return
    }
    const isFullReceive = headers[FULL_RECEIVE_HEADER] === '1'
    // 如果是全量接收
    if (isFullReceive) {
      setFullClient(originId, ws)
      return
    }
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
    // 设置唯一标识符
    data.actionID = actionId
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

type CBPClientOptions = {
  open?: () => void
  isFullReceive?: boolean // 是否全量接收
}

/**
 * CBP 客户端
 * @param url
 * @param onopen
 */
export const cbpClient = (url: string, options: CBPClientOptions = {}) => {
  /**
   * 纯 cbpClient 连接，会没有 一些 全局变量。
   * 需要在此处进行判断并设置
   */
  if (!global.chatbotClient) {
    delete global.chatbotClient
  }
  const { open = () => {}, isFullReceive = true } = options
  const start = () => {
    global.chatbotClient = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: 'client',
        [DEVICE_ID_HEADER]: deviceId,
        [FULL_RECEIVE_HEADER]: isFullReceive ? '1' : '0'
      }
    })
    global.chatbotClient.on('open', open)
    // 客户端接收，被标准化的平台消息
    global.chatbotClient.on('message', message => {
      try {
        // 解析消息
        const parsedMessage = JSON.parse(message.toString())
        logger.debug({
          code: ResultCode.Ok,
          message: '接收到消息',
          data: parsedMessage
        })
        // 如果有 actionID，说明要消费掉本地的行为请求
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
        } else if (parsedMessage.name) {
          // 如果有 name，说明是一个事件请求。要进行处理
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

export const cbpPlatform = (
  url: string,
  options = {
    open: () => {}
  }
) => {
  if (!global.chatbotPlatform) {
    delete global.chatbotPlatform
  }
  const { open = () => {} } = options

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
          // 透传消费。也就是对应的设备进行处理消费。
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
    global.chatbotPlatform.on('close', err => {
      logger.debug({
        code: ResultCode.Fail,
        message: '平台连接关闭，尝试重新连接...',
        data: err
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
