import { getConfigValue } from 'alemonjs'
import { QQBotClient } from './sdk/client'
import { createClientAPI, platform, register } from './register'
export default definePlatform(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  const client = new QQBotClient({
    secret: config?.secret,
    app_id: config?.app_id,
    route: config?.route,
    token: config?.token,
    port: config?.port,
    ws: config?.ws
  })
  // 连接
  client.connect()
  register(client as any)
  // FRIEND_ADD
  global.client = client
  return createClientAPI(client as any)
})
