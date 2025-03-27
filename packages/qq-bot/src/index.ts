import { getConfigValue } from 'alemonjs'
import QQBotGroup from './index.group'
import QQBotGuild from './index.guild'
import QQBotHook from './index.webhook'
import { QQBotAPI } from './sdk/api'
import { QQBotClients } from './sdk/client.websoket'
import { createClientAPI, register, platform } from './register'
export type Client = typeof QQBotAPI.prototype
export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      const original = global.client[prop]
      // 防止函数内this丢失
      return typeof original === 'function' ? original.bind(global.client) : original
    }
    return undefined
  }
})
export { platform }
export * from './hook'
export default definePlatform(() => {
  let value = getConfigValue()
  if (!value) value = {}
  const config = value[platform]
  if (config?.mode == 'guild') {
    if (typeof QQBotGuild.callback == 'function') {
      return QQBotGuild.callback()
    } else {
      return QQBotGuild.callback
    }
  } else if (config?.mode == 'group') {
    if (typeof QQBotGroup.callback == 'function') {
      return QQBotGroup.callback()
    } else {
      return QQBotGroup.callback
    }
  } else if (config?.route || config?.port || config?.ws) {
    if (typeof QQBotHook.callback == 'function') {
      return QQBotHook.callback()
    } else {
      return QQBotHook.callback
    }
  }
  const client = new QQBotClients({
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
            'PUBLIC_GUILD_MESSAGES',
            'GROUP_AND_C2C_EVENT'
          ],
    is_private: config?.is_private ?? false,
    sandbox: config?.sandbox ?? false,
    secret: config?.secret,
    shard: config?.shard ?? [0, 1],
    token: config?.token,
    mode: config?.mode ?? 'group'
  })
  // 连接
  client.connect(config?.gatewayURL)
  register(client as any)
  // FRIEND_ADD
  global.client = client
  return createClientAPI(client as any)
})
