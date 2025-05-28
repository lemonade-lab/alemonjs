import { WebSocket } from 'ws'
import { onProcessor } from '../app/event-processor'
import { Actions } from '../typing/actions'
import { ResultCode } from '../core/code'
import { EventsEnum } from '../typings'
import {
  actionResolves,
  actionTimeouts,
  DEVICE_ID_HEADER,
  deviceId,
  FULL_RECEIVE_HEADER,
  reconnectInterval,
  USER_AGENT_HEADER
} from './config'
import { createResult, Result } from '../post'

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
        } else if (parsedMessage?.actionID) {
          // 如果有 actionID，说明要消费掉本地的行为请求
          const resolve = actionResolves.get(parsedMessage.actionID)
          if (resolve) {
            // 清除超时器
            const timeout = actionTimeouts.get(parsedMessage.actionID)
            if (timeout) {
              clearTimeout(timeout)
              actionTimeouts.delete(parsedMessage.actionID)
            }
            // 调用回调函数
            if (Array.isArray(parsedMessage.payload)) {
              resolve(parsedMessage.payload)
            } else {
              // 错误处理
              resolve([createResult(ResultCode.Fail, '消费处理错误', null)])
            }
            actionResolves.delete(parsedMessage.actionID)
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

type ReplyFunc = (data: Actions, consume: (payload: Result[]) => void) => void

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
  const reply = (data: Actions, payload: Result[]) => {
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
          message: '平台端接收消息',
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
    onactions
  }
  return client
}
