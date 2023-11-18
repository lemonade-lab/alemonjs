import WebSocket from 'ws'
import { gateway } from './api.js'
/**
 * 创建ws监听
 */
export async function createClient() {
  const data = await gateway()
  const websocketUrl = data.url
  console.log('websocketUrl', websocketUrl)
  const wsConn = new WebSocket(websocketUrl)
  wsConn.on('open', async () => {
    wsConn.on('message', data => {
      const jsonData = data.toString()
      const parsedData = JSON.parse(jsonData)
      console.info('parsedData', parsedData)
    })
  })
  // 关闭
  wsConn.on('close', () => {
    console.error('ws close')
  })

  // 出错
  wsConn.on('error', error => {
    console.error('ws error:', error)
  })
}
