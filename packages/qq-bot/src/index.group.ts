import { QQBotGroupClient } from './sdk/client.websoket.group'
import { register } from './register'
import { getQQBotConfig } from './config'
export const start = () => {
  const config = getQQBotConfig()
  // intents 需要默认值
  const client = new QQBotGroupClient({
    ...config,
    intents: config?.intents ?? ['GROUP_AND_C2C_EVENT'],
    is_private: config?.is_private ?? false,
    sandbox: config?.sandbox ?? false,
    shard: config?.shard ?? [0, 1]
  })
  // 连接
  client.connect(config?.gatewayURL)
  register(client as any)
}
