import { getQQBotConfig } from './config'
import { register } from './register'
import { QQBotGuildClient } from './sdk/client.websoket.guild'
export const start = () => {
  const config = getQQBotConfig()
  // intents 需要默认值
  const client = new QQBotGuildClient({
    ...config,
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
    shard: config?.shard ?? [0, 1]
  })
  // 连接
  client.connect(config?.gatewayURL)
  register(client as any)
}
