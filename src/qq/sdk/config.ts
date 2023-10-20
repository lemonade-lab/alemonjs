import { BotConfig } from './typings.js'
let cfg: BotConfig = {
  appID: '',
  token: '',
  secret: '',
  intents: [],
  sandbox: false
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
export function setBotConfig(val: BotConfig) {
  cfg = val
  return
}
