import WebSocket from 'ws'

async function getWebsocketInfo(): Promise<{
  websocket_url: string
  websocket_conn_uid: number
  app_id: number
  platform: number
  device_id: number
}> {
  const data = await fetch(
    'http://devapi-takumi.mihoyo.com/vila/api/bot/platform/getWebsocketInfo',
    {
      headers: {
        'x-rpc-bot_id': 'bot_xxxxxxx',
        'x-rpc-bot_secret': 'xxxxxxxxxxxxxxx',
        'x-rpc-bot_villa_id': '2715',
        'x-rpc-bot_ts': '1697522400',
        'x-rpc-bot_nonce': '34719f00-2f13-364c-f7a7-44ca30b4f20e',
        'Content-Type': 'application/json'
      }
    }
  )
    .then(res => res.json())
    .then(res => res.data)
  return data
}

export async function createClientWS() {
  const data = await getWebsocketInfo()
  const websocketUrl = data.websocket_url
  const wsConn = new WebSocket(websocketUrl)
  wsConn.on('open', async () => {
    const platform = data.platform // Replace with the actual platform
    const deviceId = data.device_id // Replace with the actual device ID
    const uid = data.app_id // Replace with the actual UID
    const appId = data.app_id // Replace with the actual app ID
    const region = '' // Replace with the actual region
    const token = '0.xxxxx.bot_xxxx' // Replace with the actual token
    // 发送登录
    wsConn.send(
      JSON.stringify({
        uid,
        token,
        platform,
        app_id: appId,
        device_id: deviceId,
        region
      })
    )
    wsConn.on('message', data => {
      console.log('data', data)
    })
  })
  wsConn.on('error', error => {
    console.error('WebSocket error:', error)
  })
}
