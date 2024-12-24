import { defineBot, getConfig } from 'alemonjs'
import INDEXV12 from './index-12'
import { OneBotClient } from './sdk-v11/wss'
import INDEXV11 from './index-11'
export const platform = 'onebot'
export type Client = OneBotClient
export const client: Client = new Proxy({} as Client, {
  get: (_, prop: string) => {
    if (prop in global.client) {
      return global.client[prop]
    }
    return undefined
  }
})
export default defineBot(() => {
  const cfg = getConfig()
  const config = cfg.value?.onebot
  if (!config) return
  if (config.version === 'v12') {
    return INDEXV12()
  }
  return INDEXV11()
})
