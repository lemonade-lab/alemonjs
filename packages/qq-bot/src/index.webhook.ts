import { QQBotClient } from './sdk/client'
import { getQQBotConfig, register } from './register'

export const start = () => {
  const config = getQQBotConfig()
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
}
