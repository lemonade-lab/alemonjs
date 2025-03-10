import { defineBot, getConfig } from 'alemonjs'
import QQBot, { client as QQBotClient, platform as QQBotPlatform } from '@alemonjs/qq-bot'
/**
 * 废弃
 * @deprecated 请使用 @alemonjs/qq-bot
 */
export type Client = typeof QQBotClient
/**
 * 废弃
 * @deprecated 请使用 @alemonjs/qq-bot
 */
export const client: Client = QQBotClient
/**
 * 废弃
 * @deprecated 请使用 @alemonjs/qq-bot
 */
export const platform = 'qq-guild-bot'
/**
 * 废弃
 * @deprecated 请使用 @alemonjs/qq-bot
 */
export default defineBot(async () => {
  // 读取配置，自动写入mode
  const config = getConfig()
  if (!config.value[QQBotPlatform]) {
    config.value[QQBotPlatform] = {}
  }
  config.value[QQBotPlatform].mode = 'guild'
  config.saveValue(config.value)
  if (typeof QQBot.callback == 'function') {
    const callback = await QQBot.callback()
    callback.platform = platform
    return callback
  }
  QQBot.callback.platform = platform
  return QQBot.callback
})
