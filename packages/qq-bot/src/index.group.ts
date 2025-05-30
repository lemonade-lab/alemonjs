import { getConfigValue } from 'alemonjs'
import { QQBotGroupClient } from './sdk/client.websoket.group'
import { createClientAPI, register, platform } from './register'
export default definePlatform(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  // intents 需要默认值
  const client = new QQBotGroupClient({
    app_id: config?.app_id,
    intents: config?.intents ?? ['GROUP_AND_C2C_EVENT'],
    is_private: config?.is_private ?? false,
    sandbox: config?.sandbox ?? false,
    secret: config?.secret,
    shard: config?.shard ?? [0, 1],
    token: config?.token,
    mode: config?.mode
  })
  // 连接
  client.connect(config?.gatewayURL)
  register(client as any)
  // FRIEND_ADD
  global.client = client
  return createClientAPI(client as any)
})
