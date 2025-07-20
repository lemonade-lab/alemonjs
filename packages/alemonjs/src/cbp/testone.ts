import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'

/**
 * @param ws
 * @param request
 */
export const connectionTestOne = (ws: WebSocket, request: IncomingMessage) => {
  // 处理消息事件
  ws.on('message', (message: string) => {
    // 支持 读取 文件信息
  })
  // 处理关闭事件
  ws.on('close', () => {
    // 可以在这里处理连接关闭的逻辑
  })
}
