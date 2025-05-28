import Koa from 'koa'
import { WebSocketServer, WebSocket } from 'ws'
import MessageRouter from './router'
import koaStatic from 'koa-static'
import koaCors from '@koa/cors'
import { ResultCode } from '../core/code'
import {
  childrenBind,
  childrenClient,
  DEVICE_ID_HEADER,
  FULL_RECEIVE_HEADER,
  fullClient,
  platformClient,
  USER_AGENT_HEADER
} from './config'
import { getConfig } from '../core/config'

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
        logger.debug({
          code: ResultCode.Ok,
          message: '服务端接收到消息',
          data: parsedMessage
        })
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
                message: '服务端出现意外，无法绑定客户端',
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
          message: '服务端解析平台消息失败',
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

    ws.on('error', err => {
      logger.error({
        code: ResultCode.Fail,
        message: `Client ${originId} error`,
        data: err
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
    ws.on('error', err => {
      logger.error({
        code: ResultCode.Fail,
        message: `Client ${originId} error`,
        data: err
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
    // 连接时，需要给客户端发送主动消息
    ws.send(
      JSON.stringify({
        active: 'sync',
        payload: {
          value: getConfig().value,
          args: getConfig().argv,
          package: {
            version: getConfig().package?.version
          },
          env: {
            login: process.env.login,
            platform: process.env.platform,
            port: process.env.port
          }
        },
        // 主动消息
        activeId: originId
      })
    )
    const isFullReceive = headers[FULL_RECEIVE_HEADER] === '1'
    // 如果是全量接收
    if (isFullReceive) {
      setFullClient(originId, ws)
      return
    }
    setChildrenClient(originId, ws)
  })
}
