import { type BotConfig } from './typings.js'
let cfg: BotConfig = {
  appID: '',
  token: '',
  secret: '',
  intents: []
}
/**
 * 得到机器人配置
 * @returns
 */
export function getBotConfig() {
  return cfg
}
/**
 * 设置机器人配置
 * @param val
 * @returns
 */
export function setBotNTQQConfig(val: BotConfig) {
  cfg = val
  return
}
