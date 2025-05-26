import { QQBotClients } from './sdk/client.websoket'
import { register, getQQBotConfig } from './register'
export const start = () => {
  const config = getQQBotConfig()
  const client = new QQBotClients({
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
            'PUBLIC_GUILD_MESSAGES',
            'GROUP_AND_C2C_EVENT'
          ],
    is_private: config?.is_private ?? false,
    sandbox: config?.sandbox ?? false,
    shard: config?.shard ?? [0, 1],
    mode: config?.mode ?? 'group'
  })
  // 连接
  client.connect(config?.gatewayURL)
  register(client as any)
}
