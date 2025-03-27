import { getConfigValue } from 'alemonjs'
import { register } from 'module'
import { createClientAPI, platform } from './register'
import { QQBotGuildClient } from './sdk/client.websoket.guild'
export default definePlatform(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  // intents 需要默认值
  const client = new QQBotGuildClient({
    app_id: config?.app_id,
    intents:
      config?.intents ?? config?.is_private
        ? [
            'GUILDS', // base
            'GUILD_MEMBERS', // base
            'GUILD_MESSAGES',
            'GUILD_MESSAGE_REACTIONS',
            'DIRECT_MESSAGE',
            'INTERACTION',
            'FORUMS_EVENT'
          ]
        : [
            'GUILDS', // base
            'GUILD_MEMBERS', // base
            'GUILD_MESSAGE_REACTIONS',
            'DIRECT_MESSAGE',
            'INTERACTION',
            'PUBLIC_GUILD_MESSAGES'
          ],
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
