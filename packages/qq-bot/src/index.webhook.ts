import { QQBotClient } from './sdk/client'
import { getQQBotConfig, register } from './register'

export const start = () => {
  const config = getQQBotConfig()
  const client = new QQBotClient({
    ...config
  })
  // 连接
  client.connect()
  register(client as any)
}
