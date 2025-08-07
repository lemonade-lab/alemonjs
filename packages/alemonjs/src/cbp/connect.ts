import { ResultCode } from '../core/code'
import { HEARTBEAT_INTERVAL } from './config'

// 心跳
export const useHeartbeat = ({ ping, isConnected, terminate }) => {
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
