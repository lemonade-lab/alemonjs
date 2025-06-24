import { QQBotClient } from './sdk/client'
import { register } from './register'
import { getQQBotConfig } from './config'

export const start = () => {
  const config = getQQBotConfig()
  const client = new QQBotClient({
    ...config
  })
  // 连接
  client.connect()
  register(client as any)
}
