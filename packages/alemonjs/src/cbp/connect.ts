import { WebSocket } from 'ws'
import { onProcessor } from '../app/event-processor'
import { Actions } from '../typing/actions'
import { ResultCode } from '../core/code'
import { EventsEnum } from '../typings'
import {
  actionResolves,
  actionTimeouts,
  apiResolves,
  apiTimeouts,
  DEVICE_ID_HEADER,
  deviceId,
  FULL_RECEIVE_HEADER,
  HEARTBEAT_INTERVAL,
  reconnectInterval,
  USER_AGENT_HEADER
} from './config'
import { createResult, Result } from '../core/utils'
import { Apis } from '../typing/apis'
import * as JSON from 'flatted'

type CBPClientOptions = {
  open?: () => void
  isFullReceive?: boolean // 是否全量接收
}

// 心跳
const useHeartbeat = ({ ping, isConnected, terminate }) => {
  let heartbeatTimer: NodeJS.Timeout | null = null
  let lastPong = Date.now()
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }
  const callback = () => {
    if (isConnected()) {
      const diff = Date.now() - lastPong
      const max = HEARTBEAT_INTERVAL * 2 // 最大心跳间隔
      // 检查上次 pong 是否超时
      if (diff > max) {
        logger.debug({
          code: ResultCode.Fail,
          message: '心跳超时，断开重连',
          data: null
        })
        terminate() // 强制断开
        return
      }
      ping()
      logger.debug({
        code: ResultCode.Ok,
        message: `发送 ping`,
        data: null
      })
      heartbeatTimer = setTimeout(callback, HEARTBEAT_INTERVAL)
    } else {
      stopHeartbeat() // 如果连接已关闭，停止心跳
      terminate() // 强制断开
    }
  }

  const startHeartbeat = () => {
    lastPong = Date.now()
    stopHeartbeat()
    callback()
  }

  const control = {
    start: startHeartbeat,
    stop: stopHeartbeat,
    pong: () => {
      // 收到 pong，说明连接正常
      lastPong = Date.now()
      logger.debug({
        code: ResultCode.Ok,
        message: `收到 pong`,
        data: null
      })
    }
  }
  return [control]
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

  const [heartbeatControl] = useHeartbeat({
    ping: () => {
      global?.chatbotClient?.ping?.()
    },
    isConnected: () => {
      return global?.chatbotClient && global?.chatbotClient?.readyState === WebSocket.OPEN
    },
    terminate: () => {
      try {
        // 强制断开连接
        global?.chatbotClient?.terminate?.()
      } catch (error) {
        logger.debug({
          code: ResultCode.Fail,
          message: '强制断开连接失败',
          data: error
        })
      }
    }
  })

  const start = () => {
    global.chatbotClient = new WebSocket(url, {
      headers: {
        [USER_AGENT_HEADER]: 'client',
        [DEVICE_ID_HEADER]: deviceId,
        [FULL_RECEIVE_HEADER]: isFullReceive ? '1' : '0'
      }
    })
    global.chatbotClient.on('open', () => {
      open()
      heartbeatControl.start() // 启动心跳
    })

    global.chatbotClient.on('pong', () => {
      heartbeatControl.pong() // 更新 pong 时间
    })

    // 客户端接收，被标准化的平台消息
    global.chatbotClient.on('message', message => {
      try {
        // 解析消息
        const parsedMessage = JSON.parse(message.toString())
        logger.debug({
          code: ResultCode.Ok,
          message: '客户端接收到消息',
          data: parsedMessage
        })
        if (parsedMessage?.activeId) {
          // 主端端主动消息。
          if (parsedMessage.active === 'sync') {
            const configs = parsedMessage.payload
            // env 同步
            const env = configs.env || {}
            for (const key in env) {
              process.env[key] = env[key]
            }
          }
        } else if (parsedMessage?.apiId) {
          // 如果有 apiId，说明是一个接口请求。要进行处理
          const resolve = apiResolves.get(parsedMessage.apiId)
          if (resolve) {
            apiResolves.delete(parsedMessage.apiId)
            // 清除超时器
            const timeout = apiTimeouts.get(parsedMessage.apiId)
            if (timeout) {
              apiTimeouts.delete(parsedMessage.apiId)
              clearTimeout(timeout)
            }
            // 调用回调函数
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload)
            } else {
              // 错误处理
              resolve([createResult(ResultCode.Fail, '接口处理错误', null)])
            }
          }
        } else if (parsedMessage?.actionId) {
          // 如果有 actionId
          const resolve = actionResolves.get(parsedMessage.actionId)
          if (resolve) {
            actionResolves.delete(parsedMessage.actionId)
            // 清除超时器
            const timeout = actionTimeouts.get(parsedMessage.actionId)
            if (timeout) {
              actionTimeouts.delete(parsedMessage.actionId)
              clearTimeout(timeout)
            }
            // 调用回调函数
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload)
            } else {
              // 错误处理
              resolve([createResult(ResultCode.Fail, '消费处理错误', null)])
            }
          }
        } else if (parsedMessage.name) {
          // 如果有 name，说明是一个事件请求。要进行处理
          onProcessor(parsedMessage.name, parsedMessage, parsedMessage.value)
        }
      } catch (error) {
        logger.error({
          code: ResultCode.Fail,
          message: '客户端解析消息失败',
          data: error
        })
      }
    })
    global.chatbotClient.on('close', () => {
      heartbeatControl.stop() // 停止心跳
      logger.warn({
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
    global.chatbotClient.on('error', err => {
      logger.error({
        code: ResultCode.Fail,
        message: '客户端错误',
        data: err
      })
    })
  }
  start()
}

type ActionReplyFunc = (data: Actions, consume: (payload: Result[]) => void) => void

type ApiReplyFunc = (data: Apis, consume: (payload: Result[]) => void) => void

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

  const [heartbeatControl] = useHeartbeat({
    ping: () => {
      global?.chatbotPlatform?.ping?.()
    },
    isConnected: () => {
      return global?.chatbotPlatform && global?.chatbotPlatform?.readyState === WebSocket.OPEN
    },
    terminate: () => {
      try {
        global?.chatbotPlatform?.terminate?.()
      } catch (error) {
        logger.debug({
          code: ResultCode.Fail,
          message: '强制断开连接失败',
          data: error
        })
      }
    }
  })

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
  const actionReplys: ActionReplyFunc[] = []
  const apiReplys: ApiReplyFunc[] = []

  /**
   * 消费数据
   * @param data
   * @param payload
   */
  const replyAction = (data: Actions, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      // 透传消费。也就是对应的设备进行处理消费。
      global.chatbotPlatform.send(
        JSON.stringify({
          action: data.action,
          payload: payload,
          actionId: data.actionId,
          DeviceId: data.DeviceId
        })
      )
    }
  }

  const replyApi = (data: Apis, payload: Result[]) => {
    if (global.chatbotPlatform && global.chatbotPlatform.readyState === WebSocket.OPEN) {
      // 透传消费。也就是对应的设备进行处理消费。
      global.chatbotPlatform.send(
        JSON.stringify({
          action: data.action,
          apiId: data.apiId,
          DeviceId: data.DeviceId,
          payload: payload
        })
      )
    }
  }

  /**
   * 接收行为
   * @param reply
   */
  const onactions = (reply: ActionReplyFunc) => {
    actionReplys.push(reply)
  }

  /**
   * 接收接口
   */
  const onapis = (reply: ApiReplyFunc) => {
    apiReplys.push(reply)
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
    global.chatbotPlatform.on('open', () => {
      open()
      heartbeatControl.start() // 启动心跳
    })

    global.chatbotPlatform.on('pong', () => {
      heartbeatControl.pong() // 更新 pong 时间
    })

    global.chatbotPlatform.on('message', message => {
      try {
        const data = JSON.parse(message.toString())
        logger.debug({
          code: ResultCode.Ok,
          message: '平台端接收消息',
          data: data
        })
        if (data.apiId) {
          for (const cb of apiReplys) {
            cb(
              data,
              // 传入一个消费函数
              val => replyApi(data, val)
            )
          }
        } else if (data.actionId) {
          for (const cb of actionReplys) {
            cb(
              data,
              // 传入一个消费函数
              val => replyAction(data, val)
            )
          }
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
      heartbeatControl.stop() // 停止心跳
      logger.warn({
        code: ResultCode.Fail,
        message: '平台端连接关闭，尝试重新连接...',
        data: err
      })
      delete global.chatbotPlatform
      // 重新连接逻辑
      setTimeout(() => {
        start() // 重新连接
      }, reconnectInterval) // 6秒后重连
    })
    global.chatbotPlatform.on('error', err => {
      logger.error({
        code: ResultCode.Fail,
        message: '平台端错误',
        data: err
      })
    })
  }

  start()

  const client = {
    send,
    onactions,
    onapis
  }
  return client
}
