import { QQBotClients } from './sdk/client.websoket'
import { register } from './register'
import { getQQBotConfig } from './config'
import { IntentsEnum } from './sdk/intents'
export const start = () => {
  const config = getQQBotConfig()

  const notPrivateIntents = [
    'GUILDS', // base
    'GUILD_MEMBERS', // base
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE',
    'PUBLIC_GUILD_MESSAGES'
  ] as IntentsEnum[]

  const isPrivateIntents = [
    'GUILDS', // base
    'GUILD_MEMBERS', // base
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGE',
    'FORUMS_EVENT'
  ] as IntentsEnum[]

  const isGroupIntents = ['GROUP_AND_C2C_EVENT'] as IntentsEnum[]

  const pubIntents = ['INTERACTION'] as IntentsEnum[]

  const intents = [] as IntentsEnum[]

  if (config?.mode == 'guild') {
    if (config?.is_private) {
      intents.push(...isPrivateIntents, ...pubIntents)
    } else {
      intents.push(...notPrivateIntents, ...pubIntents)
    }
  } else if (config?.mode == 'group') {
    intents.push(...isGroupIntents, ...pubIntents)
  } else {
    if (config?.is_private) {
      intents.push(...isPrivateIntents, ...pubIntents)
    } else {
      intents.push(...notPrivateIntents, ...isGroupIntents, ...pubIntents)
    }
  }

  const client = new QQBotClients({
    ...config,
    intents: config?.intents || intents,
    is_private: config?.is_private ?? false,
    sandbox: config?.sandbox ?? false,
    shard: config?.shard ?? [0, 1],
    mode: config?.mode ?? 'group'
  })
  // 连接
  client.connect(config?.gatewayURL)
  register(client as any)
}
