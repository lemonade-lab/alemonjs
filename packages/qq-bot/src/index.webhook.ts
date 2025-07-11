import { QQBotClient } from './sdk/client.webhook'
import { register } from './register'
import { getQQBotConfig } from './config'

export const start = () => {
  const config = getQQBotConfig()
  const { master_id, master_key, ...cfgConfig } = config
  const client = new QQBotClient({
    ...cfgConfig
  })
  // 连接
  client.connect()
  register(client as any)
}
